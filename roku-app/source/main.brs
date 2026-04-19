sub Main(args as Dynamic)
    screen = CreateObject("roSGScreen")
    m.port = CreateObject("roMessagePort")
    screen.SetMessagePort(m.port)

    scene = screen.CreateScene("MainScene")
    screen.Show()

    if args <> invalid and args.DoesExist("contentId") and args.DoesExist("mediaType")
        scene.callFunc("handleDeepLink", {
            contentId: args.contentId,
            mediaType: args.mediaType
        })
    end if

    while true
        msg = Wait(0, m.port)
        msgType = Type(msg)

        if msgType = "roSGScreenEvent"
            if msg.IsScreenClosed()
                return
            end if
        end if
    end while
end sub
