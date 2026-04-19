sub Init()
    m.top.functionName = "fetchEvents"
end sub

sub fetchEvents()
    url = GetApiBaseUrl() + "/api/events"

    request = CreateObject("roUrlTransfer")
    request.SetUrl(url)
    request.SetCertificatesFile("common:/certs/ca-bundle.crt")
    request.AddHeader("Content-Type", "application/json")
    request.AddHeader("User-Agent", "Lineup/1.0")
    request.InitClientCertificates()
    request.EnableEncodings(true)

    port = CreateObject("roMessagePort")
    request.SetMessagePort(port)

    if request.AsyncGetToString()
        msg = Wait(10000, port)
        if Type(msg) = "roUrlEvent"
            responseCode = msg.GetResponseCode()
            if responseCode = 200
                body = msg.GetString()
                parsed = ParseJson(body)
                if parsed <> invalid and parsed.events <> invalid
                    contentNode = parseEventsToContent(parsed.events)
                    m.top.content = contentNode
                else
                    m.top.error = "Invalid response format"
                end if
            else
                m.top.error = "HTTP " + responseCode.ToStr()
            end if
        else
            m.top.error = "Request timeout"
        end if
    else
        m.top.error = "Failed to start request"
    end if
end sub

function parseEventsToContent(events as Object) as Object
    rootNode = CreateObject("roSGNode", "ContentNode")

    for each evt in events
        child = rootNode.CreateChild("ContentNode")

        child.AddFields({
            eventId: safeStr(evt.id),
            title: safeStr(evt.title),
            sport: safeStr(evt.sport),
            league: safeStr(evt.league),
            channel: safeStr(evt.channel),
            startTime: safeStr(evt.startTime),
            status: safeStr(evt.status),
            homeTeam: safeStr(evt.homeTeam),
            awayTeam: safeStr(evt.awayTeam),
            homeScore: safeStr(evt.homeScore),
            awayScore: safeStr(evt.awayScore),
            availableServices: safeArray(evt.availableServices)
        })
    end for

    return rootNode
end function

function safeStr(val as Dynamic) as String
    if val = invalid then return ""
    return val.ToStr()
end function

function safeArray(val as Dynamic) as Object
    if val = invalid then return []
    if Type(val) = "roArray" then return val
    return []
end function
