function GetStreamingServices() as Object
    return [
        {
            id: "youtube-tv",
            name: "YouTube TV",
            rokuChannelId: "195316",
            color: "#FF0000"
        },
        {
            id: "hulu-live",
            name: "Hulu",
            rokuChannelId: "46041",
            color: "#1CE783"
        },
        {
            id: "espn-plus",
            name: "ESPN+",
            rokuChannelId: "34376",
            color: "#D12828"
        },
        {
            id: "peacock",
            name: "Peacock",
            rokuChannelId: "593099",
            color: "#6B3FA0"
        },
        {
            id: "prime-video",
            name: "Prime Video",
            rokuChannelId: "13",
            color: "#00A8E1"
        },
        {
            id: "apple-tv",
            name: "Apple TV+",
            rokuChannelId: "551012",
            color: "#000000"
        },
        {
            id: "mlb-tv",
            name: "MLB.TV",
            rokuChannelId: "46246",
            color: "#002D72"
        },
        {
            id: "nba-league-pass",
            name: "NBA League Pass",
            rokuChannelId: "86065",
            color: "#1D428A"
        },
        {
            id: "nfl-plus",
            name: "NFL+",
            rokuChannelId: "241116",
            color: "#013369"
        },
        {
            id: "nfl-sunday-ticket",
            name: "Sunday Ticket",
            rokuChannelId: "195316",
            color: "#FFB612"
        }
    ]
end function

function GetSportFilters() as Object
    return [
        { id: "all", label: "All Sports", icon: "" },
        { id: "nfl", label: "NFL", icon: "" },
        { id: "nba", label: "NBA", icon: "" },
        { id: "mlb", label: "MLB", icon: "" },
        { id: "nhl", label: "NHL", icon: "" },
        { id: "soccer", label: "Soccer", icon: "" },
        { id: "college-football", label: "CFB", icon: "" },
        { id: "college-basketball", label: "CBB", icon: "" },
        { id: "mma", label: "MMA", icon: "" },
        { id: "golf", label: "Golf", icon: "" },
        { id: "tennis", label: "Tennis", icon: "" }
    ]
end function

function GetServiceById(serviceId as String) as Dynamic
    services = GetStreamingServices()
    for each svc in services
        if svc.id = serviceId then return svc
    end for
    return invalid
end function

function GetSelectedServices() as Object
    stored = ReadRegistrySetting("prefs", "selectedServices")
    if stored <> invalid and stored <> ""
        return ParseJson(stored)
    end if
    allIds = []
    for each svc in GetStreamingServices()
        allIds.Push(svc.id)
    end for
    return allIds
end function

sub SaveSelectedServices(serviceIds as Object)
    WriteRegistrySetting("prefs", "selectedServices", FormatJson(serviceIds))
end sub
