sub Init()
    m.cardBg = m.top.FindNode("cardBg")
    m.statusBadge = m.top.FindNode("statusBadge")
    m.statusLabel = m.top.FindNode("statusLabel")
    m.channelLabel = m.top.FindNode("channelLabel")
    m.homeLabel = m.top.FindNode("homeLabel")
    m.awayLabel = m.top.FindNode("awayLabel")
    m.homeScoreLabel = m.top.FindNode("homeScoreLabel")
    m.awayScoreLabel = m.top.FindNode("awayScoreLabel")
    m.sportLabel = m.top.FindNode("sportLabel")
    m.serviceBadges = m.top.FindNode("serviceBadges")
    m.focusBorder = m.top.FindNode("focusBorder")
    m.watchHint = m.top.FindNode("watchHint")
end sub

sub onContentChanged()
    content = m.top.itemContent
    if content = invalid then return

    status = content.status
    if status = invalid then status = "upcoming"

    if status = "live"
        m.statusBadge.color = "#FF3B30"
        m.statusLabel.text = chr(9679) + " LIVE"
        m.statusBadge.width = 70
    else if status = "upcoming"
        m.statusBadge.color = "#2D3548"
        timeStr = FormatEventTime(content.startTime)
        m.statusLabel.text = timeStr
        m.statusBadge.width = 80
    else
        m.statusBadge.color = "#4A5568"
        m.statusLabel.text = "FINAL"
        m.statusBadge.width = 60
    end if

    m.channelLabel.text = content.channel

    homeTeam = content.homeTeam
    awayTeam = content.awayTeam

    if homeTeam <> "" and awayTeam <> ""
        m.homeLabel.text = homeTeam
        m.awayLabel.text = awayTeam
    else
        m.homeLabel.text = content.title
        m.awayLabel.text = ""
    end if

    if status = "live" or status = "final"
        m.homeScoreLabel.text = content.homeScore
        m.awayScoreLabel.text = content.awayScore
    else
        m.homeScoreLabel.text = ""
        m.awayScoreLabel.text = ""
    end if

    m.sportLabel.text = UCase(content.league)

    m.serviceBadges.RemoveChildrenIndex(m.serviceBadges.GetChildCount(), 0)

    services = content.availableServices
    if services <> invalid
        for each svcId in services
            svc = GetServiceById(svcId)
            if svc <> invalid
                badge = CreateObject("roSGNode", "Rectangle")
                badge.width = 70
                badge.height = 20
                badge.color = svc.color

                lbl = badge.CreateChild("Label")
                lbl.text = svc.name
                lbl.font = "font:SmallestSystemFont"
                lbl.color = "#FFFFFF"
                lbl.translation = [4, 1]
                lbl.width = 62
                lbl.horizAlign = "center"

                m.serviceBadges.AppendChild(badge)
            end if
        end for
    end if
end sub

sub onFocusChanged()
    focused = m.top.focusPercent > 0.5
    m.focusBorder.visible = focused
    m.watchHint.visible = focused
    if focused
        m.cardBg.color = "#252D3D"
    else
        m.cardBg.color = "#1A1F2E"
    end if
end sub
