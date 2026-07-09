async function classifyIntent(
    transcript
) {

    /*
        Temporary provider.

        Next phase:
        OpenRouter API.
    */

    return {

        intent:
            "CONTINUE",

        confidence:
            1

    };

}

module.exports = {

    classifyIntent

};