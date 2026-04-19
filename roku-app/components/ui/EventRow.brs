sub Init()
    m.rowLabel = m.top.FindNode("rowLabel")
    m.cardRow = m.top.FindNode("cardRow")
end sub

sub onContentChanged()
    content = m.top.itemContent
    if content = invalid then return

    m.rowLabel.text = content.title

    m.cardRow.RemoveChildrenIndex(m.cardRow.GetChildCount(), 0)

    numChildren = content.GetChildCount()
    if numChildren = 0 then return

    maxCards = 5
    if numChildren < maxCards then maxCards = numChildren

    for i = 0 to maxCards - 1
        evt = content.GetChild(i)
        if evt = invalid then exit for

        card = createCardRect(evt)
        m.cardRow.AppendChild(card)
    end for
end sub

function createCardRect(evt as Object) as Object
    cardWidth = 260
    cardHeight = 170

    cardBg = CreateObject("roSGNode", "Rectangle")
    cardBg.width = cardWidth
    cardBg.height = cardHeight
    cardBg.color = "#1A1F2E"

    status = "upcoming"
    if evt.HasField("status") and evt.status <> invalid and evt.status <> ""
        status = evt.status
    end if

    statusBadge = CreateObject("roSGNode", "Rectangle")
    statusBadge.translation = [10, 10]
    statusBadge.height = 22

    statusLabel = CreateObject("roSGNode", "Label")
    statusLabel.translation = [6, 2]
    statusLabel.font = "font:SmallestSystemFont"
    statusLabel.color = "#FFFFFF"

    if status = "live"
        statusBadge.color = "#FF3B30"
        statusLabel.text = "LIVE"
        statusBadge.width = 55
    else if status = "upcoming"
        statusBadge.color = "#2D3548"
        timeStr = ""
        if evt.HasField("startTime") and evt.startTime <> invalid
            timeStr = FormatEventTime(evt.startTime)
        end if
        statusLabel.text = timeStr
        statusBadge.width = 75
    else
        statusBadge.color = "#4A5568"
        statusLabel.text = "FINAL"
        statusBadge.width = 55
    end if

    statusBadge.AppendChild(statusLabel)
    cardBg.AppendChild(statusBadge)

    channelLabel = CreateObject("roSGNode", "Label")
    channelLabel.translation = [cardWidth - 90, 12]
    channelLabel.width = 80
    channelLabel.horizAlign = "right"
    channelLabel.font = "font:SmallestSystemFont"
    channelLabel.color = "#8B95A5"
    if evt.HasField("channel") and evt.channel <> invalid
        channelLabel.text = evt.channel
    end if
    cardBg.AppendChild(channelLabel)

    homeTeam = ""
    awayTeam = ""
    eventTitle = ""
    if evt.HasField("homeTeam") and evt.homeTeam <> invalid then homeTeam = evt.homeTeam
    if evt.HasField("awayTeam") and evt.awayTeam <> invalid then awayTeam = evt.awayTeam
    if evt.HasField("title") and evt.title <> invalid then eventTitle = evt.title

    if homeTeam <> "" and awayTeam <> ""
        homeLabel = CreateObject("roSGNode", "Label")
        homeLabel.translation = [10, 42]
        homeLabel.width = 190
        homeLabel.font = "font:SmallBoldSystemFont"
        homeLabel.color = "#FFFFFF"
        homeLabel.maxLines = 1
        homeLabel.text = homeTeam
        cardBg.AppendChild(homeLabel)

        awayLabel = CreateObject("roSGNode", "Label")
        awayLabel.translation = [10, 66]
        awayLabel.width = 190
        awayLabel.font = "font:SmallBoldSystemFont"
        awayLabel.color = "#FFFFFF"
        awayLabel.maxLines = 1
        awayLabel.text = awayTeam
        cardBg.AppendChild(awayLabel)

        if status = "live" or status = "final"
            homeScore = ""
            awayScore = ""
            if evt.HasField("homeScore") and evt.homeScore <> invalid then homeScore = evt.homeScore
            if evt.HasField("awayScore") and evt.awayScore <> invalid then awayScore = evt.awayScore

            hScoreLbl = CreateObject("roSGNode", "Label")
            hScoreLbl.translation = [cardWidth - 50, 42]
            hScoreLbl.width = 40
            hScoreLbl.horizAlign = "right"
            hScoreLbl.font = "font:SmallBoldSystemFont"
            hScoreLbl.color = "#FFFFFF"
            hScoreLbl.text = homeScore
            cardBg.AppendChild(hScoreLbl)

            aScoreLbl = CreateObject("roSGNode", "Label")
            aScoreLbl.translation = [cardWidth - 50, 66]
            aScoreLbl.width = 40
            aScoreLbl.horizAlign = "right"
            aScoreLbl.font = "font:SmallBoldSystemFont"
            aScoreLbl.color = "#FFFFFF"
            aScoreLbl.text = awayScore
            cardBg.AppendChild(aScoreLbl)
        end if
    else
        titleLabel = CreateObject("roSGNode", "Label")
        titleLabel.translation = [10, 42]
        titleLabel.width = cardWidth - 20
        titleLabel.font = "font:SmallBoldSystemFont"
        titleLabel.color = "#FFFFFF"
        titleLabel.maxLines = 2
        titleLabel.text = eventTitle
        cardBg.AppendChild(titleLabel)
    end if

    league = ""
    if evt.HasField("league") and evt.league <> invalid then league = evt.league
    sportLabel = CreateObject("roSGNode", "Label")
    sportLabel.translation = [10, 98]
    sportLabel.font = "font:SmallestSystemFont"
    sportLabel.color = "#8B95A5"
    sportLabel.text = UCase(league)
    cardBg.AppendChild(sportLabel)

    return cardBg
end function
