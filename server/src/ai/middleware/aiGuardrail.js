function aiGuardrail(req, res, next) {

    const message =
        (req.body.message || "")
            .toLowerCase();

    const blockedPatterns = [

        /ignore.*instruction/i,
        /ignore.*previous/i,
        /forget.*instruction/i,
        /reveal.*prompt/i,
        /show.*system/i,
        /disable.*strict/i,
        /system.*override/i,
        /act.*as/i,
        /developer.*message/i

    ];

    const malicious =
        blockedPatterns.some(
            pattern => pattern.test(message)
        );

    if (malicious) {

        return res.status(400).json({

            success: false,

            error: {
                message:
                    "Unsafe prompt detected."
            }

        });

    }

    next();
}

module.exports = aiGuardrail;