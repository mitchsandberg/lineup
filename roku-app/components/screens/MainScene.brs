sub Init()
    m.guidePanel = m.top.FindNode("guidePanel")
    m.settingsPanel = m.top.FindNode("settingsPanel")
    m.sportFilter = m.top.FindNode("sportFilter")
    m.eventsGroup = m.top.FindNode("eventsGroup")
    m.eventsClip = m.top.FindNode("eventsClip")
    m.loadingLabel = m.top.FindNode("loadingLabel")
    m.emptyLabel = m.top.FindNode("emptyLabel")
    m.dateLabel = m.top.FindNode("dateLabel")
    m.serviceListGroup = m.top.FindNode("serviceListGroup")

    m.currentTab = 0
    m.currentSport = "all"
    m.allEvents = []
    m.scrollOffset = 0
    m.maxScroll = 0
    m.selectedServices = GetSelectedServices()
    m.settingsFocusIdx = 0
    m.eventCards = []

    m.dateLabel.text = GetTodayDateString()

    filters = GetSportFilters()
    filterLabels = []
    for each f in filters
        filterLabels.Push(f.label)
    end for
    m.sportFilter.buttons = filterLabels
    m.sportFilter.ObserveField("buttonSelected", "onSportSelected")

    m.fetchTask = m.top.FindNode("fetchTask")
    m.fetchTask.ObserveField("content", "onEventsLoaded")
    m.fetchTask.ObserveField("error", "onFetchError")

    buildServiceList()
    m.fetchTask.control = "run"
    m.sportFilter.SetFocus(true)
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

' ─── SPORT FILTER ───

sub onSportSelected()
    idx = m.sportFilter.buttonSelected
    filters = GetSportFilters()
    if idx >= 0 and idx < filters.Count()
        m.currentSport = filters[idx].id
        m.scrollOffset = 0
        filterAndDisplayEvents()
    end if
end sub

' ─── FILTERING ───

sub filterAndDisplayEvents()
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
        if shouldInclude and m.currentSport <> "all" and sport <> m.currentSport
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

    displayEvents(filtered)
end sub

' ─── RENDERING ───

sub displayEvents(events as Object)
    m.eventsGroup.RemoveChildrenIndex(m.eventsGroup.GetChildCount(), 0)
    m.eventCards = []

    if events.Count() = 0
        m.emptyLabel.visible = true
        return
    end if
    m.emptyLabel.visible = false

    if m.currentSport = "all"
        renderBySport(events)
    else
        renderFlat(events)
    end if

    m.eventsGroup.translation = [60, 0]
    m.scrollOffset = 0
end sub

sub renderBySport(events as Object)
    sportOrder = ["nfl", "nba", "mlb", "nhl", "soccer", "college-football", "college-basketball", "mma", "golf", "tennis", "racing", "other"]
    sportLabels = {
        "nfl": "NFL", "nba": "NBA", "mlb": "MLB", "nhl": "NHL",
        "soccer": "Soccer", "college-football": "College Football",
        "college-basketball": "College Basketball", "mma": "MMA & Wrestling",
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
                label = label + "  (" + liveCount.ToStr() + " LIVE)"
            end if

            sectionLabel = CreateObject("roSGNode", "Label")
            sectionLabel.text = label
            sectionLabel.font = "font:SmallBoldSystemFont"
            sectionLabel.color = "#FFFFFF"
            sectionLabel.translation = [0, yPos]
            m.eventsGroup.AppendChild(sectionLabel)
            yPos = yPos + 32

            xPos = 0
            cardCount = 0
            for each evt in sportEvents
                if cardCount >= 4 then exit for
                card = buildCard(evt, xPos, yPos)
                m.eventsGroup.AppendChild(card)
                m.eventCards.Push({ node: card, evt: evt, x: xPos, y: yPos })
                xPos = xPos + 280
                cardCount = cardCount + 1
            end for

            yPos = yPos + 185
        end if
    end for

    m.maxScroll = yPos - 500
    if m.maxScroll < 0 then m.maxScroll = 0
end sub

sub renderFlat(events as Object)
    yPos = 0
    xPos = 0
    cardCount = 0

    for each evt in events
        if cardCount > 0 and cardCount mod 4 = 0
            yPos = yPos + 185
            xPos = 0
        end if

        card = buildCard(evt, xPos, yPos)
        m.eventsGroup.AppendChild(card)
        m.eventCards.Push({ node: card, evt: evt, x: xPos, y: yPos })
        xPos = xPos + 280
        cardCount = cardCount + 1

        if cardCount >= 20 then exit for
    end for

    m.maxScroll = yPos + 185 - 500
    if m.maxScroll < 0 then m.maxScroll = 0
end sub

function buildCard(evt as Object, xPos as Integer, yPos as Integer) as Object
    cardW = 265
    cardH = 170

    card = CreateObject("roSGNode", "Rectangle")
    card.width = cardW
    card.height = cardH
    card.color = "#1A1F2E"
    card.translation = [xPos, yPos]

    status = "upcoming"
    if evt.HasField("status") and evt.status <> invalid and evt.status <> ""
        status = evt.status
    end if

    badge = CreateObject("roSGNode", "Rectangle")
    badge.translation = [10, 10]
    badge.height = 22

    badgeTxt = CreateObject("roSGNode", "Label")
    badgeTxt.translation = [6, 2]
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
        badge.width = 78
    else
        badge.color = "#4A5568"
        badgeTxt.text = "FINAL"
        badge.width = 55
    end if
    badge.AppendChild(badgeTxt)
    card.AppendChild(badge)

    channel = ""
    if evt.HasField("channel") and evt.channel <> invalid then channel = evt.channel
    chLbl = CreateObject("roSGNode", "Label")
    chLbl.translation = [cardW - 90, 12]
    chLbl.width = 80
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
        hLbl.translation = [10, 44]
        hLbl.width = 195
        hLbl.font = "font:SmallBoldSystemFont"
        hLbl.color = "#FFFFFF"
        hLbl.maxLines = 1
        hLbl.text = homeTeam
        card.AppendChild(hLbl)

        aLbl = CreateObject("roSGNode", "Label")
        aLbl.translation = [10, 68]
        aLbl.width = 195
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
            hsL.translation = [cardW - 50, 44]
            hsL.width = 40
            hsL.horizAlign = "right"
            hsL.font = "font:SmallBoldSystemFont"
            hsL.color = "#FFFFFF"
            hsL.text = hs
            card.AppendChild(hsL)

            asL = CreateObject("roSGNode", "Label")
            asL.translation = [cardW - 50, 68]
            asL.width = 40
            asL.horizAlign = "right"
            asL.font = "font:SmallBoldSystemFont"
            asL.color = "#FFFFFF"
            asL.text = as2
            card.AppendChild(asL)
        end if
    else
        tL = CreateObject("roSGNode", "Label")
        tL.translation = [10, 44]
        tL.width = cardW - 20
        tL.font = "font:SmallBoldSystemFont"
        tL.color = "#FFFFFF"
        tL.maxLines = 2
        tL.text = evtTitle
        card.AppendChild(tL)
    end if

    league = ""
    if evt.HasField("league") and evt.league <> invalid then league = evt.league
    lgL = CreateObject("roSGNode", "Label")
    lgL.translation = [10, 100]
    lgL.font = "font:SmallestSystemFont"
    lgL.color = "#8B95A5"
    lgL.text = UCase(league)
    card.AppendChild(lgL)

    svcY = 125
    svcX = 10
    if evt.HasField("availableServices") and evt.availableServices <> invalid
        for each svcId in evt.availableServices
            svc = GetServiceById(svcId)
            if svc <> invalid
                svcBg = CreateObject("roSGNode", "Rectangle")
                svcBg.width = 65
                svcBg.height = 18
                svcBg.color = svc.color
                svcBg.translation = [svcX, svcY]

                svcLbl = CreateObject("roSGNode", "Label")
                svcLbl.text = svc.name
                svcLbl.font = "font:SmallestSystemFont"
                svcLbl.color = "#FFFFFF"
                svcLbl.translation = [3, 0]
                svcLbl.width = 59
                svcLbl.horizAlign = "center"
                svcBg.AppendChild(svcLbl)

                card.AppendChild(svcBg)
                svcX = svcX + 70
                if svcX > cardW - 70 then exit for
            end if
        end for
    end if

    return card
end function

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

        isSelected = false
        for each selId in m.selectedServices
            if selId = svc.id then isSelected = true
        end for

        checkLbl = CreateObject("roSGNode", "Label")
        checkLbl.translation = [12, 10]
        checkLbl.font = "font:SmallSystemFont"
        checkLbl.color = "#30D158"
        if isSelected
            checkLbl.text = chr(10003)
        else
            checkLbl.text = " "
        end if

        nameLbl = CreateObject("roSGNode", "Label")
        nameLbl.translation = [40, 10]
        nameLbl.font = "font:SmallSystemFont"
        nameLbl.color = "#FFFFFF"
        nameLbl.text = svc.name

        colorDot = CreateObject("roSGNode", "Rectangle")
        colorDot.width = 8
        colorDot.height = 8
        colorDot.color = svc.color
        colorDot.translation = [480, 18]

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
    m.sportFilter.SetFocus(true)
    filterAndDisplayEvents()
end sub

sub showSettings()
    m.currentTab = 1
    m.guidePanel.visible = false
    m.settingsPanel.visible = true
    m.settingsFocusIdx = 0
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
    if key = "up"
        m.scrollOffset = m.scrollOffset - 200
        if m.scrollOffset < 0 then m.scrollOffset = 0
        m.eventsGroup.translation = [60, -m.scrollOffset]
        return true
    end if

    if key = "down"
        m.scrollOffset = m.scrollOffset + 200
        if m.scrollOffset > m.maxScroll then m.scrollOffset = m.maxScroll
        m.eventsGroup.translation = [60, -m.scrollOffset]
        return true
    end if

    if key = "replay" or key = "play"
        m.loadingLabel.visible = true
        m.loadingLabel.text = "Refreshing..."
        m.emptyLabel.visible = false
        m.fetchTask.control = "run"
        return true
    end if

    if key = "right"
        showSettings()
        return true
    end if

    return false
end function

function handleSettingsKeys(key as String) as Boolean
    if key = "back" or key = "left"
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
