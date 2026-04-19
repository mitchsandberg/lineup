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

    scene.ObserveField("exitApp", m.port)

    while true
        msg = Wait(0, m.port)
        msgType = Type(msg)

        if msgType = "roSGScreenEvent"
            if msg.IsScreenClosed()
                return
            end if
        end if

        if msgType = "roSGNodeEvent" and msg.GetField() = "exitApp" and msg.GetData() = true
            screen.Close()
            return
        end if
    end while
end sub
