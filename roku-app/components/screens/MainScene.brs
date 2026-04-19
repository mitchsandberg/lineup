sub Init()
    m.guidePanel = m.top.FindNode("guidePanel")
    m.settingsPanel = m.top.FindNode("settingsPanel")
    m.sportSelectorBg = m.top.FindNode("sportSelectorBg")
    m.sportSelectorLabel = m.top.FindNode("sportSelectorLabel")
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

    m.dateLabel.text = GetTodayDateString()
    updateSportLabel()

    m.fetchTask = m.top.FindNode("fetchTask")
    m.fetchTask.ObserveField("content", "onEventsLoaded")
    m.fetchTask.ObserveField("error", "onFetchError")

    buildServiceList()
    m.fetchTask.control = "run"

    m.top.SetFocus(true)
    updateFilterVisual()
end sub

' ─── SPORT FILTER ───

sub updateSportLabel()
    filters = GetSportFilters()
    if m.sportFilterIdx >= 0 and m.sportFilterIdx < filters.Count()
        m.sportSelectorLabel.text = filters[m.sportFilterIdx].label
    end if
end sub

sub cycleSport(direction as Integer)
    filters = GetSportFilters()
    m.sportFilterIdx = m.sportFilterIdx + direction
    if m.sportFilterIdx < 0 then m.sportFilterIdx = filters.Count() - 1
    if m.sportFilterIdx >= filters.Count() then m.sportFilterIdx = 0
    updateSportLabel()
    m.scrollOffset = 0
    m.focusRow = 0
    m.focusCol = 0
    filterAndDisplayEvents()
end sub

sub updateFilterVisual()
    if m.focusMode = "filter"
        m.sportSelectorBg.color = "#252D3D"
    else
        m.sportSelectorBg.color = "#1A1F2E"
    end if
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
            services = invalid
            if evt.HasField("availableServices") then services = evt.availableServices
            if services <> invalid
                for each svcId in services
                    if selectedSvcSet.DoesExist(svcId)
                        hasService = true
                        exit for
                    end if
                end for
            end if
            if services = invalid or services.Count() = 0 then hasService = true
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
        renderFlat(events)
    end if

    m.eventsGroup.translation = [0, 0]
    m.scrollOffset = 0
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

    m.maxScroll = yPos - 520
    if m.maxScroll < 0 then m.maxScroll = 0
end sub

sub renderFlat(events as Object)
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
        yPos = renderTimeSection("Live Now", liveNow.Count().ToStr() + " game" + plural(liveNow.Count()), liveNow, yPos, true)
    end if

    if startingSoon.Count() > 0
        yPos = renderTimeSection("Starting Soon", startingSoon.Count().ToStr() + " game" + plural(startingSoon.Count()), startingSoon, yPos, false)
    end if

    if laterToday.Count() > 0
        yPos = renderTimeSection("Later Today", laterToday.Count().ToStr() + " game" + plural(laterToday.Count()), laterToday, yPos, false)
    end if

    if tomorrow.Count() > 0
        yPos = renderTimeSection("Tomorrow", tomorrow.Count().ToStr() + " game" + plural(tomorrow.Count()), tomorrow, yPos, false)
    end if

    m.maxScroll = yPos - 520
    if m.maxScroll < 0 then m.maxScroll = 0
end sub

function plural(count as Integer) as String
    if count = 1 then return ""
    return "s"
end function

function renderTimeSection(title as String, subtitle as String, events as Object, yPos as Integer, isLive as Boolean) as Integer
    titleLbl = CreateObject("roSGNode", "Label")
    titleLbl.text = title
    titleLbl.font = "font:MediumBoldSystemFont"
    titleLbl.color = "#FFFFFF"
    titleLbl.translation = [0, yPos]
    m.eventsGroup.AppendChild(titleLbl)

    if isLive
        liveBadge = CreateObject("roSGNode", "Rectangle")
        liveBadge.translation = [titleLbl.boundingRect()["width"] + 15, yPos + 4]
        liveBadge.width = 60
        liveBadge.height = 22
        liveBadge.color = "#FF3B30"
        liveBadge.cornerRadius = 4
        liveLbl = CreateObject("roSGNode", "Label")
        liveLbl.text = events.Count().ToStr() + " LIVE"
        liveLbl.font = "font:SmallestSystemFont"
        liveLbl.color = "#FFFFFF"
        liveLbl.translation = [6, 3]
        liveBadge.AppendChild(liveLbl)
        m.eventsGroup.AppendChild(liveBadge)
    end if

    subLbl = CreateObject("roSGNode", "Label")
    subLbl.font = "font:SmallSystemFont"
    subLbl.color = "#8B95A5"
    subLbl.translation = [0, yPos + 30]
    subLbl.text = subtitle
    m.eventsGroup.AppendChild(subLbl)
    yPos = yPos + 55

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

function buildCard(evt as Object, xPos as Integer, yPos as Integer) as Object
    cardW = 275
    cardH = 185

    card = CreateObject("roSGNode", "Rectangle")
    card.width = cardW
    card.height = cardH
    card.color = "#1A1F2E"
    card.translation = [xPos, yPos]
    card.cornerRadius = 8

    status = "upcoming"
    if evt.HasField("status") and evt.status <> invalid and evt.status <> ""
        status = evt.status
    end if

    badge = CreateObject("roSGNode", "Rectangle")
    badge.translation = [12, 12]
    badge.height = 24
    badge.cornerRadius = 4
    badgeTxt = CreateObject("roSGNode", "Label")
    badgeTxt.translation = [8, 3]
    badgeTxt.font = "font:SmallestSystemFont"
    badgeTxt.color = "#FFFFFF"

    if status = "live"
        badge.color = "#FF3B30"
        badgeTxt.text = "LIVE"
        badge.width = 50
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
        hLbl.width = 200
        hLbl.font = "font:SmallBoldSystemFont"
        hLbl.color = "#FFFFFF"
        hLbl.maxLines = 1
        hLbl.text = homeTeam
        card.AppendChild(hLbl)

        aLbl = CreateObject("roSGNode", "Label")
        aLbl.translation = [12, 72]
        aLbl.width = 200
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
            hsL.translation = [cardW - 45, 48]
            hsL.width = 35
            hsL.horizAlign = "right"
            hsL.font = "font:SmallBoldSystemFont"
            hsL.color = "#FFFFFF"
            hsL.text = hs
            card.AppendChild(hsL)

            asL = CreateObject("roSGNode", "Label")
            asL.translation = [cardW - 45, 72]
            asL.width = 35
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

    svcY = 130
    svcX = 12
    if evt.HasField("availableServices") and evt.availableServices <> invalid
        badgeCount = 0
        for each svcId in evt.availableServices
            if badgeCount >= 3 then exit for
            svc = GetServiceById(svcId)
            if svc <> invalid
                shortName = svc.name
                if svc.DoesExist("short") then shortName = svc.short

                bw = 75
                if Len(shortName) <= 4 then bw = 52
                if Len(shortName) <= 5 then bw = 60

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
    end if

    watchHint = CreateObject("roSGNode", "Label")
    watchHint.id = "watchHint"
    watchHint.translation = [12, cardH - 22]
    watchHint.font = "font:SmallestSystemFont"
    watchHint.color = "#30D158"
    watchHint.text = "Press OK to watch"
    watchHint.visible = false
    card.AppendChild(watchHint)

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
                cardInfo.node.color = "#2A3350"
            else
                cardInfo.node.color = "#1A1F2E"
            end if
            childCount = cardInfo.node.GetChildCount()
            for i = 0 to childCount - 1
                child = cardInfo.node.GetChild(i)
                if child.id = "watchHint"
                    child.visible = isFocused
                end if
            end for
        end for
    end for

    if m.cardGrid.Count() > 0 and m.focusRow < m.cardGrid.Count()
        row = m.cardGrid[m.focusRow]
        if m.focusCol < row.Count()
            cardInfo = row[m.focusCol]
            cardY = cardInfo.node.translation[1]
            visibleTop = m.scrollOffset
            visibleBottom = m.scrollOffset + 520

            if cardY < visibleTop
                m.scrollOffset = cardY - 30
                if m.scrollOffset < 0 then m.scrollOffset = 0
            else if cardY + 185 > visibleBottom
                m.scrollOffset = cardY + 185 - 520
            end if
            m.eventsGroup.translation = [0, -m.scrollOffset]
        end if
    end if

    updateFilterVisual()
end sub

sub launchSelectedCard()
    if m.focusRow >= m.cardGrid.Count() then return
    row = m.cardGrid[m.focusRow]
    if m.focusCol >= row.Count() then return

    evt = row[m.focusCol].evt
    services = invalid
    if evt.HasField("availableServices") then services = evt.availableServices
    if services <> invalid and services.Count() > 0
        svcId = services[0]
        svc = GetServiceById(svcId)
        if svc <> invalid
            LaunchChannel(svc.rokuChannelId, "")
        end if
    end if
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
        row.cornerRadius = 6

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
    updateFilterVisual()
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
                updateCardFocus()
                updateFilterVisual()
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
            updateCardFocus()
            updateFilterVisual()
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
