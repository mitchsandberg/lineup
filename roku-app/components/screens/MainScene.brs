sub Init()
    m.guidePanel = m.top.FindNode("guidePanel")
    m.settingsPanel = m.top.FindNode("settingsPanel")
    m.sportPillsGroup = m.top.FindNode("sportPillsGroup")
    m.eventsGroup = m.top.FindNode("eventsGroup")
    m.loadingLabel = m.top.FindNode("loadingLabel")
    m.emptyLabel = m.top.FindNode("emptyLabel")
    m.dateLabel = m.top.FindNode("dateLabel")
    m.serviceListGroup = m.top.FindNode("serviceListGroup")

    m.currentTab = 0
    m.sportFilterIdx = 0
    m.allEvents = []
    m.scrollOffset = 0
    m.maxScroll = 0
    m.selectedServices = GetSelectedServices()
    m.settingsFocusIdx = 0

    m.cardGrid = []
    m.focusRow = 0
    m.focusCol = 0
    m.focusMode = "filter"
    m.sportPills = []

    m.pickerOverlay = m.top.FindNode("pickerOverlay")
    m.pickerBox = m.top.FindNode("pickerBox")
    m.pickerItemsGroup = m.top.FindNode("pickerItemsGroup")
    m.pickerServices = []
    m.pickerFocusIdx = 0

    m.EVENTS_BASE_Y = 120

    m.dateLabel.text = GetTodayDateString()
    buildSportPills()

    m.fetchTask = m.top.FindNode("fetchTask")
    m.fetchTask.ObserveField("content", "onEventsLoaded")
    m.fetchTask.ObserveField("error", "onFetchError")

    buildServiceList()
    m.fetchTask.control = "run"
    m.top.SetFocus(true)
    updateSportPillVisuals()
end sub

' ─── SPORT FILTER PILLS ───

sub buildSportPills()
    filters = GetSportFilters()
    xPos = 0
    for i = 0 to filters.Count() - 1
        f = filters[i]
        label = f.label
        pillW = 55 + Len(label) * 6
        if pillW < 60 then pillW = 60

        pill = CreateObject("roSGNode", "Rectangle")
        pill.width = pillW
        pill.height = 34
        pill.color = "#1A1F2E"
        pill.translation = [xPos, 0]
        pill.cornerRadius = 17

        pillLbl = CreateObject("roSGNode", "Label")
        pillLbl.text = label
        pillLbl.font = "font:SmallestBoldSystemFont"
        pillLbl.color = "#8B95A5"
        pillLbl.width = pillW
        pillLbl.horizAlign = "center"
        pillLbl.translation = [0, 7]
        pill.AppendChild(pillLbl)

        m.sportPillsGroup.AppendChild(pill)
        m.sportPills.Push({ node: pill, lbl: pillLbl, width: pillW })

        xPos = xPos + pillW + 10
    end for
end sub

sub updateSportPillVisuals()
    for i = 0 to m.sportPills.Count() - 1
        pill = m.sportPills[i]
        if i = m.sportFilterIdx
            if m.focusMode = "filter"
                pill.node.color = "#FFFFFF"
                pill.lbl.color = "#0D1117"
            else
                pill.node.color = "#252D3D"
                pill.lbl.color = "#FFFFFF"
            end if
        else
            pill.node.color = "#1A1F2E"
            pill.lbl.color = "#8B95A5"
        end if
    end for
end sub

sub cycleSport(direction as Integer)
    filters = GetSportFilters()
    m.sportFilterIdx = m.sportFilterIdx + direction
    if m.sportFilterIdx < 0 then m.sportFilterIdx = filters.Count() - 1
    if m.sportFilterIdx >= filters.Count() then m.sportFilterIdx = 0
    updateSportPillVisuals()
    m.scrollOffset = 0
    m.focusRow = 0
    m.focusCol = 0
    filterAndDisplayEvents()
end sub

' ─── DATA ───

sub onEventsLoaded()
    m.loadingLabel.visible = false
    rawContent = m.fetchTask.content
    if rawContent = invalid or rawContent.GetChildCount() = 0
        m.emptyLabel.visible = true
        return
    end if

    m.allEvents = []
    for i = 0 to rawContent.GetChildCount() - 1
        m.allEvents.Push(rawContent.GetChild(i))
    end for
    filterAndDisplayEvents()
end sub

sub onFetchError()
    m.loadingLabel.text = m.fetchTask.error
end sub

' ─── FILTERING ───

sub filterAndDisplayEvents()
    filters = GetSportFilters()
    currentSport = "all"
    if m.sportFilterIdx >= 0 and m.sportFilterIdx < filters.Count()
        currentSport = filters[m.sportFilterIdx].id
    end if

    selectedSvcSet = {}
    for each svcId in m.selectedServices
        selectedSvcSet[svcId] = true
    end for

    filtered = []
    for each evt in m.allEvents
        shouldInclude = true
        status = "upcoming"
        if evt.HasField("status") and evt.status <> invalid then status = evt.status
        if status = "final" then shouldInclude = false

        sport = ""
        if evt.HasField("sport") and evt.sport <> invalid then sport = evt.sport
        if shouldInclude and currentSport <> "all" and sport <> currentSport
            shouldInclude = false
        end if

        if shouldInclude
            hasService = false
            csv = ""
            if evt.HasField("servicesCsv") and evt.servicesCsv <> invalid
                csv = evt.servicesCsv
            end if
            svcIds = SplitCsv(csv)
            if svcIds.Count() > 0
                for each svcId in svcIds
                    if selectedSvcSet.DoesExist(svcId)
                        hasService = true
                        exit for
                    end if
                end for
            else
                hasService = true
            end if
            if hasService then filtered.Push(evt)
        end if
    end for

    displayEvents(filtered, currentSport)
end sub

' ─── RENDERING ───

sub displayEvents(events as Object, currentSport as String)
    m.eventsGroup.RemoveChildrenIndex(m.eventsGroup.GetChildCount(), 0)
    m.cardGrid = []

    if events.Count() = 0
        m.emptyLabel.visible = true
        return
    end if
    m.emptyLabel.visible = false

    if currentSport = "all"
        renderBySport(events)
    else
        renderByTime(events)
    end if

    m.scrollOffset = 0
    m.eventsGroup.translation = [60, m.EVENTS_BASE_Y]
    if m.focusMode = "cards" then updateCardFocus()
end sub

sub renderBySport(events as Object)
    sportOrder = ["nfl", "nba", "mlb", "nhl", "soccer", "college-football", "college-basketball", "mma", "golf", "tennis", "racing", "other"]
    sportLabels = {
        "nfl": "NFL", "nba": "NBA", "mlb": "MLB", "nhl": "NHL",
        "soccer": "Soccer", "college-football": "College Football",
        "college-basketball": "College Basketball", "mma": "MMA",
        "golf": "Golf", "tennis": "Tennis", "racing": "Racing", "other": "Other"
    }

    bySport = {}
    for each evt in events
        sport = "other"
        if evt.HasField("sport") and evt.sport <> invalid and evt.sport <> ""
            sport = evt.sport
        end if
        if not bySport.DoesExist(sport) then bySport[sport] = []
        bySport[sport].Push(evt)
    end for

    yPos = 0
    for each sport in sportOrder
        if bySport.DoesExist(sport) and bySport[sport].Count() > 0
            sportEvents = bySport[sport]
            liveCount = 0
            for each e in sportEvents
                if e.HasField("status") and e.status = "live"
                    liveCount = liveCount + 1
                end if
            end for

            label = sportLabels[sport]
            if label = invalid then label = sport
            if liveCount > 0
                label = label + " (" + liveCount.ToStr() + " LIVE)"
            end if

            sLbl = CreateObject("roSGNode", "Label")
            sLbl.text = label
            sLbl.font = "font:SmallBoldSystemFont"
            sLbl.color = "#FFFFFF"
            sLbl.translation = [0, yPos]
            m.eventsGroup.AppendChild(sLbl)
            yPos = yPos + 32

            rowCards = []
            xPos = 0
            cardCount = 0
            for each evt in sportEvents
                if cardCount >= 4 then exit for
                card = buildCard(evt, xPos, yPos)
                m.eventsGroup.AppendChild(card)
                rowCards.Push({ node: card, evt: evt })
                xPos = xPos + 285
                cardCount = cardCount + 1
            end for
            m.cardGrid.Push(rowCards)
            yPos = yPos + 200
        end if
    end for

    m.maxScroll = yPos - 550
    if m.maxScroll < 0 then m.maxScroll = 0
end sub

sub renderByTime(events as Object)
    liveNow = []
    startingSoon = []
    laterToday = []
    tomorrow = []

    now = CreateObject("roDateTime")
    nowSec = now.AsSeconds()
    now.ToLocalTime()
    todayDay = now.GetDayOfMonth()

    for each evt in events
        status = "upcoming"
        if evt.HasField("status") and evt.status <> invalid then status = evt.status

        if status = "live"
            liveNow.Push(evt)
        else
            startTime = ""
            if evt.HasField("startTime") and evt.startTime <> invalid
                startTime = evt.startTime
            end if
            if startTime <> ""
                evtDt = CreateObject("roDateTime")
                evtDt.FromISO8601String(startTime)
                evtSec = evtDt.AsSeconds()
                diffMin = (evtSec - nowSec) / 60

                evtDt.ToLocalTime()
                evtDay = evtDt.GetDayOfMonth()

                if diffMin <= 60 and diffMin > 0
                    startingSoon.Push(evt)
                else if evtDay = todayDay
                    laterToday.Push(evt)
                else
                    tomorrow.Push(evt)
                end if
            else
                laterToday.Push(evt)
            end if
        end if
    end for

    yPos = 0

    if liveNow.Count() > 0
        yPos = renderTimeSection("Live Now", liveNow.Count(), liveNow, yPos, true)
    end if
    if startingSoon.Count() > 0
        yPos = renderTimeSection("Starting Soon", startingSoon.Count(), startingSoon, yPos, false)
    end if
    if laterToday.Count() > 0
        yPos = renderTimeSection("Later Today", laterToday.Count(), laterToday, yPos, false)
    end if
    if tomorrow.Count() > 0
        yPos = renderTimeSection("Tomorrow", tomorrow.Count(), tomorrow, yPos, false)
    end if

    m.maxScroll = yPos - 550
    if m.maxScroll < 0 then m.maxScroll = 0
end sub

function renderTimeSection(title as String, count as Integer, events as Object, yPos as Integer, isLive as Boolean) as Integer
    titleLbl = CreateObject("roSGNode", "Label")
    titleLbl.text = title
    titleLbl.font = "font:MediumBoldSystemFont"
    titleLbl.color = "#FFFFFF"
    titleLbl.translation = [0, yPos]
    m.eventsGroup.AppendChild(titleLbl)

    if isLive
        liveBadge = CreateObject("roSGNode", "Rectangle")
        liveBadge.width = 65
        liveBadge.height = 24
        liveBadge.color = "#FF3B30"
        liveBadge.cornerRadius = 5
        liveBadge.translation = [180, yPos + 3]
        liveLbl = CreateObject("roSGNode", "Label")
        liveLbl.text = count.ToStr() + " LIVE"
        liveLbl.font = "font:SmallestBoldSystemFont"
        liveLbl.color = "#FFFFFF"
        liveLbl.translation = [8, 4]
        liveBadge.AppendChild(liveLbl)
        m.eventsGroup.AppendChild(liveBadge)
    end if

    suffix = " game"
    if count <> 1 then suffix = " games"
    subLbl = CreateObject("roSGNode", "Label")
    subLbl.font = "font:SmallSystemFont"
    subLbl.color = "#8B95A5"
    if isLive
        subLbl.translation = [255, yPos + 5]
    else
        subLbl.translation = [180, yPos + 5]
    end if
    subLbl.text = count.ToStr() + suffix
    m.eventsGroup.AppendChild(subLbl)
    yPos = yPos + 38

    rowCards = []
    xPos = 0
    cardCount = 0
    for each evt in events
        if cardCount > 0 and cardCount mod 4 = 0
            m.cardGrid.Push(rowCards)
            rowCards = []
            yPos = yPos + 200
            xPos = 0
        end if

        card = buildCard(evt, xPos, yPos)
        m.eventsGroup.AppendChild(card)
        rowCards.Push({ node: card, evt: evt })
        xPos = xPos + 285
        cardCount = cardCount + 1
    end for

    if rowCards.Count() > 0 then m.cardGrid.Push(rowCards)
    yPos = yPos + 210
    return yPos
end function

' ─── CARD BUILDER ───

function buildCard(evt as Object, xPos as Integer, yPos as Integer) as Object
    cardW = 275
    cardH = 185

    card = CreateObject("roSGNode", "Rectangle")
    card.width = cardW
    card.height = cardH
    card.color = "#1A1F2E"
    card.translation = [xPos, yPos]
    card.cornerRadius = 10

    status = "upcoming"
    if evt.HasField("status") and evt.status <> invalid and evt.status <> ""
        status = evt.status
    end if

    badge = CreateObject("roSGNode", "Rectangle")
    badge.translation = [12, 12]
    badge.height = 24
    badge.cornerRadius = 5
    badgeTxt = CreateObject("roSGNode", "Label")
    badgeTxt.translation = [8, 3]
    badgeTxt.font = "font:SmallestSystemFont"
    badgeTxt.color = "#FFFFFF"

    if status = "live"
        badge.color = "#FF3B30"
        badgeTxt.text = chr(9679) + " LIVE"
        badge.width = 65
    else if status = "upcoming"
        badge.color = "#2D3548"
        timeStr = ""
        if evt.HasField("startTime") and evt.startTime <> invalid
            timeStr = FormatEventTime(evt.startTime)
        end if
        badgeTxt.text = timeStr
        badge.width = 82
    else
        badge.color = "#4A5568"
        badgeTxt.text = "FINAL"
        badge.width = 58
    end if
    badge.AppendChild(badgeTxt)
    card.AppendChild(badge)

    channel = ""
    if evt.HasField("channel") and evt.channel <> invalid then channel = evt.channel
    chLbl = CreateObject("roSGNode", "Label")
    chLbl.translation = [cardW - 90, 14]
    chLbl.width = 78
    chLbl.horizAlign = "right"
    chLbl.font = "font:SmallestSystemFont"
    chLbl.color = "#8B95A5"
    chLbl.text = channel
    card.AppendChild(chLbl)

    homeTeam = ""
    awayTeam = ""
    evtTitle = ""
    if evt.HasField("homeTeam") and evt.homeTeam <> invalid then homeTeam = evt.homeTeam
    if evt.HasField("awayTeam") and evt.awayTeam <> invalid then awayTeam = evt.awayTeam
    if evt.title <> invalid then evtTitle = evt.title

    if homeTeam <> "" and awayTeam <> ""
        hLbl = CreateObject("roSGNode", "Label")
        hLbl.translation = [12, 48]
        hLbl.width = 185
        hLbl.font = "font:SmallBoldSystemFont"
        hLbl.color = "#FFFFFF"
        hLbl.maxLines = 1
        hLbl.text = homeTeam
        card.AppendChild(hLbl)

        aLbl = CreateObject("roSGNode", "Label")
        aLbl.translation = [12, 72]
        aLbl.width = 185
        aLbl.font = "font:SmallBoldSystemFont"
        aLbl.color = "#FFFFFF"
        aLbl.maxLines = 1
        aLbl.text = awayTeam
        card.AppendChild(aLbl)

        if status = "live" or status = "final"
            hs = ""
            as2 = ""
            if evt.HasField("homeScore") and evt.homeScore <> invalid then hs = evt.homeScore
            if evt.HasField("awayScore") and evt.awayScore <> invalid then as2 = evt.awayScore

            hsL = CreateObject("roSGNode", "Label")
            hsL.translation = [cardW - 60, 48]
            hsL.width = 50
            hsL.horizAlign = "right"
            hsL.font = "font:SmallBoldSystemFont"
            hsL.color = "#FFFFFF"
            hsL.text = hs
            card.AppendChild(hsL)

            asL = CreateObject("roSGNode", "Label")
            asL.translation = [cardW - 60, 72]
            asL.width = 50
            asL.horizAlign = "right"
            asL.font = "font:SmallBoldSystemFont"
            asL.color = "#FFFFFF"
            asL.text = as2
            card.AppendChild(asL)
        end if
    else
        tL = CreateObject("roSGNode", "Label")
        tL.translation = [12, 48]
        tL.width = cardW - 24
        tL.font = "font:SmallBoldSystemFont"
        tL.color = "#FFFFFF"
        tL.maxLines = 2
        tL.text = evtTitle
        card.AppendChild(tL)
    end if

    league = ""
    if evt.HasField("league") and evt.league <> invalid then league = evt.league
    lgL = CreateObject("roSGNode", "Label")
    lgL.translation = [12, 104]
    lgL.font = "font:SmallestSystemFont"
    lgL.color = "#8B95A5"
    lgL.text = UCase(league)
    card.AppendChild(lgL)

    svcY = 132
    svcX = 12
    svcCsv = ""
    if evt.HasField("servicesCsv") and evt.servicesCsv <> invalid
        svcCsv = evt.servicesCsv
    end if
    svcIdList = SplitCsv(svcCsv)
    badgeCount = 0
    for each svcId in svcIdList
        if badgeCount >= 2 then exit for
        svc = GetServiceById(svcId)
        if svc <> invalid
            shortName = svc.name
            if svc.DoesExist("short") then shortName = svc.short
            bw = 80
            if Len(shortName) <= 4 then bw = 60
            if svcX + bw > cardW - 10 then exit for

            svcBg = CreateObject("roSGNode", "Rectangle")
            svcBg.width = bw
            svcBg.height = 22
            svcBg.color = svc.color
            svcBg.translation = [svcX, svcY]
            svcBg.cornerRadius = 4

            svcLbl = CreateObject("roSGNode", "Label")
            svcLbl.text = shortName
            svcLbl.font = "font:SmallestSystemFont"
            svcLbl.color = "#FFFFFF"
            svcLbl.translation = [4, 2]
            svcLbl.width = bw - 8
            svcLbl.horizAlign = "center"
            svcBg.AppendChild(svcLbl)
            card.AppendChild(svcBg)

            svcX = svcX + bw + 6
            badgeCount = badgeCount + 1
        end if
    end for

    watchHint = CreateObject("roSGNode", "Label")
    watchHint.id = "watchHint"
    watchHint.translation = [12, cardH - 22]
    watchHint.font = "font:SmallestSystemFont"
    watchHint.color = "#30D158"
    watchHint.text = "Press OK to watch"
    watchHint.visible = false
    card.AppendChild(watchHint)

    border = CreateObject("roSGNode", "Rectangle")
    border.id = "focusBorder"
    border.width = cardW
    border.height = cardH
    border.color = "#00000000"
    border.visible = false

    bTop = CreateObject("roSGNode", "Rectangle")
    bTop.width = cardW
    bTop.height = 3
    bTop.color = "#FFFFFF"
    border.AppendChild(bTop)

    bBot = CreateObject("roSGNode", "Rectangle")
    bBot.width = cardW
    bBot.height = 3
    bBot.color = "#FFFFFF"
    bBot.translation = [0, cardH - 3]
    border.AppendChild(bBot)

    bLeft = CreateObject("roSGNode", "Rectangle")
    bLeft.width = 3
    bLeft.height = cardH
    bLeft.color = "#FFFFFF"
    border.AppendChild(bLeft)

    bRight = CreateObject("roSGNode", "Rectangle")
    bRight.width = 3
    bRight.height = cardH
    bRight.color = "#FFFFFF"
    bRight.translation = [cardW - 3, 0]
    border.AppendChild(bRight)

    card.AppendChild(border)
    return card
end function

' ─── CARD FOCUS ───

sub updateCardFocus()
    for r = 0 to m.cardGrid.Count() - 1
        row = m.cardGrid[r]
        for c = 0 to row.Count() - 1
            cardInfo = row[c]
            isFocused = (r = m.focusRow and c = m.focusCol and m.focusMode = "cards")
            if isFocused
                cardInfo.node.color = "#252D3D"
            else
                cardInfo.node.color = "#1A1F2E"
            end if
            childCount = cardInfo.node.GetChildCount()
            for i = 0 to childCount - 1
                child = cardInfo.node.GetChild(i)
                if child.id = "watchHint" then child.visible = isFocused
                if child.id = "focusBorder" then child.visible = isFocused
            end for
        end for
    end for

    if m.cardGrid.Count() > 0 and m.focusRow < m.cardGrid.Count()
        row = m.cardGrid[m.focusRow]
        if m.focusCol < row.Count()
            cardInfo = row[m.focusCol]
            cardY = cardInfo.node.translation[1]
            visibleTop = m.scrollOffset
            visibleBottom = m.scrollOffset + 550

            if cardY < visibleTop
                m.scrollOffset = cardY - 30
                if m.scrollOffset < 0 then m.scrollOffset = 0
            else if cardY + 185 > visibleBottom
                m.scrollOffset = cardY + 185 - 550
            end if
            m.eventsGroup.translation = [60, m.EVENTS_BASE_Y - m.scrollOffset]
        end if
    end if

    updateSportPillVisuals()
end sub

sub launchSelectedCard()
    if m.cardGrid.Count() = 0 then return
    if m.focusRow < 0 or m.focusRow >= m.cardGrid.Count() then return
    row = m.cardGrid[m.focusRow]
    if m.focusCol < 0 or m.focusCol >= row.Count() then return

    cardInfo = row[m.focusCol]
    if cardInfo = invalid or cardInfo.evt = invalid then return

    evt = cardInfo.evt
    csv = ""
    if evt.HasField("servicesCsv") and evt.servicesCsv <> invalid
        csv = evt.servicesCsv
    end if
    svcIds = SplitCsv(csv)
    if svcIds.Count() = 0 then return

    installed = []
    allMatched = []
    for each svcId in svcIds
        svc = GetServiceById(svcId)
        if svc <> invalid
            allMatched.Push(svc)
            if IsChannelInstalled(svc.rokuChannelId)
                installed.Push(svc)
            end if
        end if
    end for

    if installed.Count() = 1
        LaunchChannel(installed[0].rokuChannelId, "")
    else if installed.Count() > 1
        showServicePicker(installed)
    else if allMatched.Count() = 1
        LaunchChannel(allMatched[0].rokuChannelId, "")
    else if allMatched.Count() > 1
        showServicePicker(allMatched)
    end if
end sub

sub showServicePicker(services as Object)
    m.pickerServices = services
    m.pickerFocusIdx = 0
    m.pickerItemsGroup.RemoveChildrenIndex(m.pickerItemsGroup.GetChildCount(), 0)

    yPos = 0
    for i = 0 to services.Count() - 1
        svc = services[i]
        row = CreateObject("roSGNode", "Rectangle")
        row.width = 340
        row.height = 42
        row.color = "#252D3D"
        row.translation = [0, yPos]
        row.cornerRadius = 8

        dot = CreateObject("roSGNode", "Rectangle")
        dot.width = 12
        dot.height = 12
        dot.color = svc.color
        dot.translation = [14, 15]
        dot.cornerRadius = 6
        row.AppendChild(dot)

        lbl = CreateObject("roSGNode", "Label")
        lbl.text = svc.name
        lbl.font = "font:SmallBoldSystemFont"
        lbl.color = "#FFFFFF"
        lbl.translation = [36, 9]
        lbl.width = 240
        row.AppendChild(lbl)

        installed = IsChannelInstalled(svc.rokuChannelId)
        if installed
            tag = CreateObject("roSGNode", "Label")
            tag.text = "Installed"
            tag.font = "font:SmallestSystemFont"
            tag.color = "#30D158"
            tag.translation = [270, 13]
            row.AppendChild(tag)
        end if

        m.pickerItemsGroup.AppendChild(row)
        yPos = yPos + 48
    end for

    boxH = 100 + services.Count() * 48
    if boxH > 500 then boxH = 500
    m.pickerBox.height = boxH
    m.pickerBox.translation = [440, (720 - boxH) / 2]

    m.focusMode = "picker"
    m.pickerOverlay.visible = true
    updatePickerFocus()
end sub

sub updatePickerFocus()
    for i = 0 to m.pickerItemsGroup.GetChildCount() - 1
        row = m.pickerItemsGroup.GetChild(i)
        if i = m.pickerFocusIdx
            row.color = "#3A4560"
        else
            row.color = "#252D3D"
        end if
    end for
end sub

sub hideServicePicker()
    m.pickerOverlay.visible = false
    m.focusMode = "cards"
    updateCardFocus()
end sub

sub launchPickerSelection()
    if m.pickerFocusIdx < 0 or m.pickerFocusIdx >= m.pickerServices.Count() then return
    svc = m.pickerServices[m.pickerFocusIdx]
    hideServicePicker()
    LaunchChannel(svc.rokuChannelId, "")
end sub

' ─── SETTINGS ───

sub buildServiceList()
    m.serviceListGroup.RemoveChildrenIndex(m.serviceListGroup.GetChildCount(), 0)
    services = GetStreamingServices()
    m.serviceToggles = []

    yPos = 0
    for each svc in services
        row = CreateObject("roSGNode", "Rectangle")
        row.width = 500
        row.height = 44
        row.color = "#1A1F2E"
        row.translation = [0, yPos]
        row.cornerRadius = 8

        isSelected = false
        for each selId in m.selectedServices
            if selId = svc.id then isSelected = true
        end for

        checkLbl = CreateObject("roSGNode", "Label")
        checkLbl.translation = [14, 10]
        checkLbl.font = "font:SmallSystemFont"
        checkLbl.color = "#30D158"
        if isSelected
            checkLbl.text = chr(10003)
        else
            checkLbl.text = " "
        end if

        nameLbl = CreateObject("roSGNode", "Label")
        nameLbl.translation = [44, 10]
        nameLbl.font = "font:SmallSystemFont"
        nameLbl.color = "#FFFFFF"
        nameLbl.text = svc.name

        colorDot = CreateObject("roSGNode", "Rectangle")
        colorDot.width = 10
        colorDot.height = 10
        colorDot.color = svc.color
        colorDot.translation = [478, 17]
        colorDot.cornerRadius = 5

        row.AppendChild(checkLbl)
        row.AppendChild(nameLbl)
        row.AppendChild(colorDot)
        m.serviceListGroup.AppendChild(row)

        m.serviceToggles.Push({
            node: row,
            checkLbl: checkLbl,
            svcId: svc.id,
            selected: isSelected
        })
        yPos = yPos + 50
    end for
    updateSettingsFocus()
end sub

sub updateSettingsFocus()
    for i = 0 to m.serviceToggles.Count() - 1
        toggle = m.serviceToggles[i]
        if i = m.settingsFocusIdx
            toggle.node.color = "#252D3D"
        else
            toggle.node.color = "#1A1F2E"
        end if
    end for
end sub

sub toggleService()
    if m.settingsFocusIdx < 0 or m.settingsFocusIdx >= m.serviceToggles.Count()
        return
    end if
    toggle = m.serviceToggles[m.settingsFocusIdx]
    toggle.selected = not toggle.selected
    m.serviceToggles[m.settingsFocusIdx] = toggle
    if toggle.selected
        toggle.checkLbl.text = chr(10003)
    else
        toggle.checkLbl.text = " "
    end if
    newSelected = []
    for each t in m.serviceToggles
        if t.selected then newSelected.Push(t.svcId)
    end for
    m.selectedServices = newSelected
    SaveSelectedServices(newSelected)
end sub

' ─── TAB SWITCHING ───

sub showGuide()
    m.currentTab = 0
    m.guidePanel.visible = true
    m.settingsPanel.visible = false
    m.focusMode = "filter"
    m.top.SetFocus(true)
    updateSportPillVisuals()
    filterAndDisplayEvents()
end sub

sub showSettings()
    m.currentTab = 1
    m.guidePanel.visible = false
    m.settingsPanel.visible = true
    m.settingsFocusIdx = 0
    m.top.SetFocus(true)
    updateSettingsFocus()
end sub

' ─── DEEP LINKING ───

function handleDeepLink(params as Object) as Boolean
    if params = invalid then return false
    if params.DoesExist("contentId")
        svc = GetServiceById(params.contentId)
        if svc <> invalid
            LaunchChannel(svc.rokuChannelId, "")
            return true
        end if
    end if
    return false
end function

' ─── KEY HANDLING ───

function OnKeyEvent(key as String, press as Boolean) as Boolean
    if not press then return false

    if m.focusMode = "picker"
        return handlePickerKeys(key)
    end if

    if key = "options"
        if m.currentTab = 0
            showSettings()
        else
            showGuide()
        end if
        return true
    end if

    if m.currentTab = 0
        return handleGuideKeys(key)
    else
        return handleSettingsKeys(key)
    end if
end function

function handleGuideKeys(key as String) as Boolean
    if m.focusMode = "filter"
        if key = "left"
            cycleSport(-1)
            return true
        end if
        if key = "right"
            cycleSport(1)
            return true
        end if
        if key = "down"
            if m.cardGrid.Count() > 0
                m.focusMode = "cards"
                m.focusRow = 0
                m.focusCol = 0
                updateCardFocus()
            end if
            return true
        end if
        if key = "OK"
            showSettings()
            return true
        end if
        return false
    end if

    if m.focusMode = "cards"
        if key = "up"
            if m.focusRow > 0
                m.focusRow = m.focusRow - 1
                row = m.cardGrid[m.focusRow]
                if m.focusCol >= row.Count() then m.focusCol = row.Count() - 1
                updateCardFocus()
            else
                m.focusMode = "filter"
                m.scrollOffset = 0
                m.eventsGroup.translation = [60, m.EVENTS_BASE_Y]
                updateCardFocus()
                updateSportPillVisuals()
            end if
            return true
        end if

        if key = "down"
            if m.focusRow < m.cardGrid.Count() - 1
                m.focusRow = m.focusRow + 1
                row = m.cardGrid[m.focusRow]
                if m.focusCol >= row.Count() then m.focusCol = row.Count() - 1
                updateCardFocus()
            end if
            return true
        end if

        if key = "left"
            if m.focusCol > 0
                m.focusCol = m.focusCol - 1
                updateCardFocus()
            end if
            return true
        end if

        if key = "right"
            row = m.cardGrid[m.focusRow]
            if m.focusCol < row.Count() - 1
                m.focusCol = m.focusCol + 1
                updateCardFocus()
            end if
            return true
        end if

        if key = "OK"
            launchSelectedCard()
            return true
        end if

        if key = "back"
            m.focusMode = "filter"
            m.scrollOffset = 0
            m.eventsGroup.translation = [60, m.EVENTS_BASE_Y]
            updateCardFocus()
            updateSportPillVisuals()
            return true
        end if

        if key = "replay" or key = "play"
            m.loadingLabel.visible = true
            m.loadingLabel.text = "Refreshing..."
            m.emptyLabel.visible = false
            m.fetchTask.control = "run"
            return true
        end if
    end if

    return false
end function

function handleSettingsKeys(key as String) as Boolean
    if key = "back" or key = "options"
        showGuide()
        return true
    end if
    if key = "up"
        if m.settingsFocusIdx > 0
            m.settingsFocusIdx = m.settingsFocusIdx - 1
            updateSettingsFocus()
        end if
        return true
    end if
    if key = "down"
        if m.settingsFocusIdx < m.serviceToggles.Count() - 1
            m.settingsFocusIdx = m.settingsFocusIdx + 1
            updateSettingsFocus()
        end if
        return true
    end if
    if key = "OK"
        toggleService()
        return true
    end if
    return false
end function

function handlePickerKeys(key as String) as Boolean
    if key = "back"
        hideServicePicker()
        return true
    end if
    if key = "up"
        if m.pickerFocusIdx > 0
            m.pickerFocusIdx = m.pickerFocusIdx - 1
            updatePickerFocus()
        end if
        return true
    end if
    if key = "down"
        if m.pickerFocusIdx < m.pickerServices.Count() - 1
            m.pickerFocusIdx = m.pickerFocusIdx + 1
            updatePickerFocus()
        end if
        return true
    end if
    if key = "OK"
        launchPickerSelection()
        return true
    end if
    return true
end function
