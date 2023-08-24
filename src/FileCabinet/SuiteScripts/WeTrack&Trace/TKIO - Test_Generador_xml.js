/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/log', './Netsuite_Lib/Mod/TKIO - SuiteTrace EPCIS xml generator'],
    /**
 * @param{log} log
 */
    (log, epcisXMLGenerator) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            try {
                let jsonResponse = {};
                jsonResponse.resultPrueba = epcisXMLGenerator.generateEpcis(345);
                log.debug({ title:'jsonResponse', details:jsonResponse });
            } catch (error) {
                log.error({ title:'test_generador_xml', details:error });
            }
        }

        return {onRequest}

    });
