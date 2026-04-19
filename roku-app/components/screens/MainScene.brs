sub Init()
    m.tabButtons = m.top.FindNode("tabButtons")
    m.sportFilter = m.top.FindNode("sportFilter")
    m.eventRowList = m.top.FindNode("eventRowList")
    m.loadingGroup = m.top.FindNode("loadingGroup")
    m.emptyLabel = m.top.FindNode("emptyLabel")
    m.settingsPanel = m.top.FindNode("settingsPanel")
    m.serviceCheckList = m.top.FindNode("serviceCheckList")
    m.dateLabel = m.top.FindNode("dateLabel")

    m.currentTab = 0 ' 0 = Guide, 1 = Settings
    m.currentSport = "all"
    m.allEvents = []
    m.selectedServices = GetSelectedServices()

    m.dateLabel.text = GetTodayDateString()

    setupSportFilter()
    setupServiceCheckList()

    m.tabButtons.ObserveField("buttonSelected", "onTabSelected")
    m.sportFilter.ObserveField("itemSelected", "onSportSelected")
    m.eventRowList.ObserveField("rowItemSelected", "onEventSelected")
    m.serviceCheckList.ObserveField("checkedState", "onServicesChanged")

    m.fetchTask = m.top.FindNode("fetchTask")
    m.fetchTask.ObserveField("content", "onEventsLoaded")
    m.fetchTask.ObserveField("error", "onFetchError")

    fetchEvents()

    m.sportFilter.SetFocus(true)
end sub

sub setupSportFilter()
    filters = GetSportFilters()
    content = CreateObject("roSGNode", "ContentNode")
    for each f in filters
        item = content.CreateChild("ContentNode")
        item.title = f.label
        item.id = f.id
    end for
    m.sportFilter.content = content
end sub

sub setupServiceCheckList()
    services = GetStreamingServices()
    content = CreateObject("roSGNode", "ContentNode")
    checkedState = []

    for each svc in services
        item = content.CreateChild("ContentNode")
        item.title = svc.name
        item.id = svc.id

        isSelected = false
        for each selId in m.selectedServices
            if selId = svc.id then isSelected = true
        end for
        checkedState.Push(isSelected)
    end for

    m.serviceCheckList.content = content
    m.serviceCheckList.checkedState = checkedState
end sub

sub fetchEvents()
    m.loadingGroup.visible = true
    m.emptyLabel.visible = false
    m.fetchTask.control = "run"
end sub

sub onEventsLoaded()
    m.loadingGroup.visible = false

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
    m.loadingGroup.visible = false
    m.emptyLabel.text = "Failed to load sports data. Press OK to retry."
    m.emptyLabel.visible = true
end sub

sub filterAndDisplayEvents()
    selectedSvcSet = {}
    for each svcId in m.selectedServices
        selectedSvcSet[svcId] = true
    end for

    filtered = []
    for each evt in m.allEvents
        if evt.status = "final" then continue for

        if m.currentSport <> "all" and evt.sport <> m.currentSport
            continue for
        end if

        hasService = false
        services = evt.availableServices
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
    end for

    if m.currentSport = "all"
        displayBySport(filtered)
    else
        displayByTime(filtered)
    end if
end sub

sub displayBySport(events as Object)
    sportOrder = ["nfl", "nba", "mlb", "nhl", "soccer", "college-football", "college-basketball", "mma", "golf", "tennis", "racing", "other"]
    sportLabels = {
        "nfl": "NFL", "nba": "NBA", "mlb": "MLB", "nhl": "NHL",
        "soccer": "Soccer", "college-football": "College Football",
        "college-basketball": "College Basketball", "mma": "MMA & Wrestling",
        "golf": "Golf", "tennis": "Tennis", "racing": "Racing", "other": "Other"
    }

    bySport = {}
    for each evt in events
        sport = evt.sport
        if sport = invalid or sport = "" then sport = "other"
        if not bySport.DoesExist(sport) then bySport[sport] = []
        bySport[sport].Push(evt)
    end for

    rowContent = CreateObject("roSGNode", "ContentNode")

    for each sport in sportOrder
        if bySport.DoesExist(sport) and bySport[sport].Count() > 0
            sportEvents = bySport[sport]
            liveCount = 0
            for each e in sportEvents
                if e.status = "live" then liveCount = liveCount + 1
            end for

            label = sportLabels[sport]
            if label = invalid then label = sport
            if liveCount > 0
                label = label + "  (" + liveCount.ToStr() + " LIVE)"
            end if

            row = rowContent.CreateChild("ContentNode")
            row.title = label

            for each evt in sportEvents
                card = row.CreateChild("EventCardNode")
                card.eventId = evt.eventId
                card.title = evt.title
                card.sport = evt.sport
                card.league = evt.league
                card.channel = evt.channel
                card.startTime = evt.startTime
                card.status = evt.status
                card.homeTeam = evt.homeTeam
                card.awayTeam = evt.awayTeam
                card.homeScore = evt.homeScore
                card.awayScore = evt.awayScore

                if evt.availableServices <> invalid
                    card.availableServices = evt.availableServices
                end if
            end for
        end if
    end for

    m.eventRowList.content = rowContent
    m.emptyLabel.visible = (rowContent.GetChildCount() = 0)
end sub

sub displayByTime(events as Object)
    liveEvents = []
    upcomingEvents = []

    for each evt in events
        if evt.status = "live"
            liveEvents.Push(evt)
        else
            upcomingEvents.Push(evt)
        end if
    end for

    rowContent = CreateObject("roSGNode", "ContentNode")

    if liveEvents.Count() > 0
        liveRow = rowContent.CreateChild("ContentNode")
        liveRow.title = "Live Now (" + liveEvents.Count().ToStr() + ")"
        for each evt in liveEvents
            addEventCard(liveRow, evt)
        end for
    end if

    if upcomingEvents.Count() > 0
        upRow = rowContent.CreateChild("ContentNode")
        upRow.title = "Upcoming (" + upcomingEvents.Count().ToStr() + ")"
        for each evt in upcomingEvents
            addEventCard(upRow, evt)
        end for
    end if

    m.eventRowList.content = rowContent
    m.emptyLabel.visible = (rowContent.GetChildCount() = 0)
end sub

sub addEventCard(parentRow as Object, evt as Object)
    card = parentRow.CreateChild("EventCardNode")
    card.eventId = evt.eventId
    card.title = evt.title
    card.sport = evt.sport
    card.league = evt.league
    card.channel = evt.channel
    card.startTime = evt.startTime
    card.status = evt.status
    card.homeTeam = evt.homeTeam
    card.awayTeam = evt.awayTeam
    card.homeScore = evt.homeScore
    card.awayScore = evt.awayScore
    if evt.availableServices <> invalid
        card.availableServices = evt.availableServices
    end if
end sub

sub onTabSelected()
    selected = m.tabButtons.buttonSelected
    if selected = 0
        m.settingsPanel.visible = false
        m.currentTab = 0
        m.sportFilter.SetFocus(true)
    else if selected = 1
        m.settingsPanel.visible = true
        m.currentTab = 1
        m.serviceCheckList.SetFocus(true)
    end if
end sub

sub onSportSelected()
    idx = m.sportFilter.itemSelected
    filters = GetSportFilters()
    if idx >= 0 and idx < filters.Count()
        m.currentSport = filters[idx].id
        filterAndDisplayEvents()
    end if
end sub

sub onEventSelected()
    rowIdx = m.eventRowList.rowItemSelected[0]
    colIdx = m.eventRowList.rowItemSelected[1]

    rowContent = m.eventRowList.content
    if rowContent = invalid then return

    row = rowContent.GetChild(rowIdx)
    if row = invalid then return

    card = row.GetChild(colIdx)
    if card = invalid then return

    services = card.availableServices
    if services <> invalid and services.Count() > 0
        svcId = services[0]
        svc = GetServiceById(svcId)
        if svc <> invalid
            LaunchChannel(svc.rokuChannelId, "")
        end if
    end if
end sub

sub onServicesChanged()
    checkedState = m.serviceCheckList.checkedState
    services = GetStreamingServices()
    selected = []

    for i = 0 to services.Count() - 1
        if i < checkedState.Count() and checkedState[i] = true
            selected.Push(services[i].id)
        end if
    end for

    m.selectedServices = selected
    SaveSelectedServices(selected)

    if m.currentTab = 0
        filterAndDisplayEvents()
    end if
end sub

function handleDeepLink(params as Object) as Boolean
    if params = invalid then return false

    contentId = ""
    if params.DoesExist("contentId") then contentId = params.contentId

    if contentId <> ""
        svc = GetServiceById(contentId)
        if svc <> invalid
            LaunchChannel(svc.rokuChannelId, "")
            return true
        end if
    end if

    return false
end function

function OnKeyEvent(key as String, press as Boolean) as Boolean
    if not press then return false

    if key = "back"
        if m.currentTab = 1
            m.tabButtons.buttonSelected = 0
            onTabSelected()
            return true
        end if
        return false
    end if

    if key = "options"
        if m.currentTab = 0
            m.tabButtons.buttonSelected = 1
            onTabSelected()
        else
            m.tabButtons.buttonSelected = 0
            onTabSelected()
        end if
        return true
    end if

    if key = "replay" or key = "play"
        fetchEvents()
        return true
    end if

    return false
end function
