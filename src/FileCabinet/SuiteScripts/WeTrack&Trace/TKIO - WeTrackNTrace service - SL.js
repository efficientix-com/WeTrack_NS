/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @name TKIO - WeTrackNTrace service - SL
 * @version 1.0
 * @author Magdiel Jiménez <magdiel.jimenez@freebug.mx>
 * @summary Script de backend para producto de WeTrackNTrace de Healix
 */
define(['N/log', 'N/search', 'N/record', 'N/format'],
    (log, search, record, format) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const SEARCH_ID = '4967';
        const SEARCH_ID_VENDORS = '4991';
        const SEARCH_TYPE_VENDORS = 'vendor';
        const SEARCH_TYPE = 'transaction';
        const CUSTOM_RECORD_ID = 'customrecord_tkio_transactionhistory';

        const onRequest = (scriptContext) => {
            let response = scriptContext.response, request = scriptContext.request, params = request.parameters;
            try {
                log.debug({
                    title: "Params received",
                    details: params
                });
                if (params.getSearchTracing) {
                    var result_data = search_for_tracing(SEARCH_ID, SEARCH_TYPE);
                    const objResultData = JSON.stringify(result_data);
                    response.write({
                        output: objResultData
                    });
                }
                if (params.sendTrack) {
                    log.debug({
                        title: "SendTrack params received",
                        details: JSON.parse(params.sendTrack)
                    });
                    new_registry_track(JSON.parse(params.sendTrack)).then(resp => {
                        log.debug({
                            title: "response_newTRackRegistry",
                            details: resp
                        });
                        response.write({
                            output: resp + ''
                        });
                    });
                }
                if(params.getSearchVendors){
                    // Get Search results from vendor
                    var result_data_vendors = search_for_tracing(SEARCH_ID_VENDORS, SEARCH_TYPE_VENDORS);
                    const objResultData_vendors = JSON.stringify(result_data_vendors);
                    log.debug({
                        title: "objResultData_vendors",
                        details: objResultData_vendors
                    });
                    response.write({
                        output:objResultData_vendors
                    });
                }
            } catch (err) {
                log.error({
                    title: "Error occurrred on onRequest",
                    details: err
                });
            }
        }

        const search_for_tracing = (search_id, search_type) => {
            try {
                var s = search.load({ id: search_id, type: search_type });
                var columns = get_search_columns(s);
                var resultData = [];
                var resultObject = {};
                const transactionSearchPagedData = s.runPaged({ pageSize: 1000 });
                for (let i = 0; i < transactionSearchPagedData.pageRanges.length; i++) {
                    const transactionSearchPage = transactionSearchPagedData.fetch({ index: i });
                    transactionSearchPage.data.forEach((result) => {
                        for (let j in columns) {
                            resultObject['id'] = result.id;
                            var name = columns[j].name;
                            if (columns[j].join) {
                                name += "_" + columns[j].join;
                            }
                            name = name.toLowerCase();
                            var text = result.getText(columns[j]);
                            if (text) {
                                resultObject[name] = text || '';
                                resultObject[name + "_id"] = result.getValue(columns[j]) || '';
                            } else {
                                resultObject[name] = result.getValue(columns[j]) || '';
                            }
                        }
                        resultData.push(resultObject);
                        log.debug({
                            title: "ResultObject",
                            details: resultObject
                        });
                        resultObject = {};
                        return true;
                    });
                }
                // log.audit({ title: "search_for_tracing RETURNING", details: resultData });
                return resultData;

            } catch (err) {
                log.error({
                    title: "Error occurred on search_for_tracing()",
                    details: err
                });
            }

        }
        const get_search_columns = (saved_search) => {
            try {
                var columns = [];
                for (var i = 0; i < saved_search.columns.length; i++) {
                    columns.push(saved_search.columns[i]);
                }
                log.debug({ title: 'get_search_columns - return', details: columns });
                return columns;
            } catch (e) {
                log.error({ title: 'Error occurred on get_search_columns', details: e });
            }
        }
        const new_registry_track = async (body) => {
            try {
                let objRecord = record.create({
                    type: CUSTOM_RECORD_ID,
                    isDynamic: true
                });
                for (let key in body) {
                    if (body.hasOwnProperty(key)) {
                        if (key === 'custrecord_tkio_transaction_date') {
                            let formattedDate = format.parse({ value: body[key], type: format.Type.DATE });
                            objRecord.setValue({
                                fieldId: key,
                                value: formattedDate
                            });
                        } else {
                            objRecord.setValue({
                                fieldId: key,
                                value: body[key]
                            });
                        }
                    }
                }
                objRecord.save();
                return "Successfully registered";

            } catch (err) {
                log.error({
                    title: "Error occurred in New_registry_track",
                    details: err
                });
                return "Error: " + err.message;
            }
        }

        return { onRequest }

    });
