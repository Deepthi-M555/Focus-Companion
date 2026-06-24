const {
    RESPONSE_ACTIONS
} = require(
    "../utils/responseActions"
);

function executeAction({

    action,

    io,

    userId

}) {

    try {

        switch (action) {

            case RESPONSE_ACTIONS.START_FOCUS:

                io.to(
                    `user:${userId}`
                ).emit(
                    "focus:start"
                );

                return {
                    success: true,
                    action
                };

            case RESPONSE_ACTIONS.TRIGGER_BREAK:

                io.to(
                    `user:${userId}`
                ).emit(
                    "focus:break"
                );

                return {
                    success: true,
                    action
                };

            case RESPONSE_ACTIONS.ACTIVATE_STRICT_MODE:

                io.to(
                    `user:${userId}`
                ).emit(
                    "strict:enabled"
                );

                return {
                    success: true,
                    action
                };

            case RESPONSE_ACTIONS.GENERATE_TIMETABLE:

                io.to(
                    `user:${userId}`
                ).emit(
                    "schedule:generate"
                );

                return {
                    success: true,
                    action
                };

            case RESPONSE_ACTIONS.REGENERATE_TIMETABLE:

                io.to(
                    `user:${userId}`
                ).emit(
                    "schedule:regenerate"
                );

                return {
                    success: true,
                    action
                };

            default:

                return {
                    success: false,
                    action: "UNKNOWN"
                };

        }

    } catch (error) {

        return {

            success: false,

            action,

            error:
                error.message

        };

    }

}

module.exports = {
    executeAction
};