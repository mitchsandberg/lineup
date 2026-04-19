function GetApiBaseUrl() as String
    return "https://lineup-api-31li.onrender.com"
end function

function FormatEventTime(isoTimestamp as String) as String
    if isoTimestamp = "" or isoTimestamp = invalid then return ""

    dt = CreateObject("roDateTime")
    dt.FromISO8601String(isoTimestamp)
    dt.ToLocalTime()

    hours = dt.GetHours()
    minutes = dt.GetMinutes()
    ampm = "AM"

    if hours >= 12
        ampm = "PM"
        if hours > 12 then hours = hours - 12
    end if
    if hours = 0 then hours = 12

    minuteStr = minutes.ToStr()
    if minutes < 10 then minuteStr = "0" + minuteStr

    return hours.ToStr() + ":" + minuteStr + " " + ampm
end function

function GetTodayDateString() as String
    dt = CreateObject("roDateTime")
    dt.ToLocalTime()
    months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    return days[dt.GetDayOfWeek()] + ", " + months[dt.GetMonth() - 1] + " " + dt.GetDayOfMonth().ToStr()
end function

function GetStatusColor(status as String) as String
    if status = "live" then return "#FF3B30"
    if status = "upcoming" then return "#30D158"
    return "#8E8E93"
end function

function GetStatusLabel(status as String) as String
    if status = "live" then return "LIVE"
    if status = "upcoming" then return FormatEventTime(m.top.startTime)
    return "FINAL"
end function

function GetMascotName(fullName as String) as String
    if fullName = invalid or fullName = "" then return ""
    lastSpace = 0
    for i = 1 to Len(fullName)
        if Mid(fullName, i, 1) = " " then lastSpace = i
    end for
    if lastSpace > 0 and lastSpace < Len(fullName)
        return Mid(fullName, lastSpace + 1)
    end if
    return fullName
end function

function SplitCsv(csv as String) as Object
    result = []
    if csv = invalid or csv = "" then return result
    current = ""
    for i = 0 to Len(csv) - 1
        ch = Mid(csv, i + 1, 1)
        if ch = ","
            if current <> "" then result.Push(current)
            current = ""
        else
            current = current + ch
        end if
    end for
    if current <> "" then result.Push(current)
    return result
end function

sub LaunchChannel(channelId as String, params as String)
    url = "http://127.0.0.1:8060/launch/" + channelId
    if params <> "" and params <> invalid
        url = url + "?" + params
    end if

    m.launchTransfer = CreateObject("roUrlTransfer")
    m.launchTransfer.SetUrl(url)
    m.launchPort = CreateObject("roMessagePort")
    m.launchTransfer.SetMessagePort(m.launchPort)
    m.launchTransfer.AsyncPostFromString("")
end sub

function ReadRegistrySetting(section as String, key as String) as Dynamic
    sec = CreateObject("roRegistrySection", section)
    if sec.Exists(key)
        return sec.Read(key)
    end if
    return invalid
end function

sub WriteRegistrySetting(section as String, key as String, value as String)
    sec = CreateObject("roRegistrySection", section)
    sec.Write(key, value)
    sec.Flush()
end sub
