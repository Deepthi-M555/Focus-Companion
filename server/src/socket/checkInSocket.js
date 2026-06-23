module.exports =
(
    io,
    socket
) => {

    socket.on(

        "check-in-required",

        () => {

            io.to(
                socket.id
            ).emit(

                "show-check-in",

                {

                    message:
                        "Session Complete"

                }

            );

        }

    );

};