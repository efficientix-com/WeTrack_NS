/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
/**
 * @name TKIO - WeTrackNTrace service - SL
 * @version 1.0
 * @author Magdiel Jiménez <magdiel.jimenez@freebug.mx>
 * @summary Script de backend para producto de WeTrackNTrace de Healix
 */
define(['N/log', 'N/search', 'N/record', 'N/format', 'N/query', 'N/runtime'],
    (log, search, record, format, query, runtime) => {
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
                // log.debug({
                //     title: "Params received",
                //     details: params
                // });
                // track_query();
                if (params.getTrackSearch) {
                    // let track_results = track_query2();
                    let track_results = search3ts();
                    log.emergency({
                        title: "TRACK RESULTS",
                        details: track_results
                    })
                    response.write({
                        output: JSON.stringify(track_results)
                    });

                }
                if (params.getSearchVendors) {
                    var scriptObj = runtime.getCurrentScript();
                    var script_parameters = scriptObj.getParameter({ name: 'custscript_tkio_wetrack_configuration' });
                    log.debug({
                        title: "script_parameters",
                        details: script_parameters
                    });
                    if (script_parameters) {
                        let resVWC = JSON.stringify(searchVendorsByCategory(script_parameters));
                        log.debug({
                            title: "resVWC",
                            details: resVWC
                        });
                        response.write({
                            output: resVWC
                        });

                    } else {
                        log.error({
                            title: "Parameter is empty",
                            details: "Fill out the parameters of the script"
                        });
                    }
                }
                log.debug({
                    title: "here",
                    details: "Passed"
                })
                if (params.getSearchTracing) {
                    var result_data = track_query();
                    log.debug({
                        title: "result_data",
                        details: result_data
                    });
                    const objResultData = JSON.stringify(result_data);
                    // var result_data = search_for_tracing(SEARCH_ID, SEARCH_TYPE);
                    // const objResultData = JSON.stringify(result_data);
                    response.write({
                        output: objResultData
                    });
                }
                if (request.method === 'POST') {
                    log.debug({
                        title: "request",
                        details: typeof request.body
                    });
                    let sendTrackBody_aux = JSON.parse(request.body)
                    log.debug({
                        title: "sendTrackBody_aux",
                        details: sendTrackBody_aux
                    });

                    new_registry_track(sendTrackBody_aux.sendTrackBody).then(resp => {
                        log.debug({
                            title: "response_newTRackRegistry",
                            details: resp
                        });
                        response.write({
                            output: resp + ''
                        });
                    });
                    // }
                }
                // if (params.getSearchVendors) {
                //     // Get Search results from vendor
                //     var result_data_vendors = search_for_tracing(SEARCH_ID_VENDORS, SEARCH_TYPE_VENDORS);
                //     const objResultData_vendors = JSON.stringify(result_data_vendors);
                //     log.debug({
                //         title: "objResultData_vendors",
                //         details: objResultData_vendors
                //     });
                //     response.write({
                //         output: objResultData_vendors
                //     });
                // }
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
                        // log.debug({
                        //     title: "ResultObject search_type",
                        //     details: resultObject
                        // });
                        resultObject = {};
                        return true;
                    });
                }
                log.audit({ title: "search_for_tracing RETURNING " + search_type, details: resultData });
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
                log.debug({
                    title: 'typeof body',
                    details: typeof body
                })
                body = String(body).replaceAll('\n', ' ')
                log.debug({
                    title: 'body',
                    details: body
                })
                body = JSON.parse(body);
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
        const track_query2 = () => {
            try {
                var query_str = 'SELECT * '
                    + 'FROM customrecord_tkio_wetrack_epcis_transact AS epcistran '
                    + 'INNER JOIN customrecord_tkio_suitetrace_grouping AS grouping ON grouping.id = epcistran.custrecord_tkio_suitetrace_grouping'
                    + 'WHERE'
                    + "grouping.isinactive = 'F'"
                    + "AND epcistran.isnactive = 'F'";
                var results = query.runSuiteQL({
                    query: query_str
                }).asMappedResults();
                return results

            } catch (err) {
                log.error({ title: 'Error occurred in track_query2', details: err });
            }
        }
        const search3ts = () => {
            try {
                const data_array = [];
                const customrecord_tkio_wetrack_epcis_transactSearchColDateCreated = search.createColumn({ name: 'created' });
                const customrecord_tkio_wetrack_epcis_transactSearchColIsThFromFile = search.createColumn({ name: 'custrecord_tkio_is_th_file', sort: search.Sort.ASC });
                const customrecord_tkio_wetrack_epcis_transactSearchColTransaction = search.createColumn({ name: 'custrecord_tkio_transaction_list' });
                const customrecord_tkio_wetrack_epcis_transactSearchColLotNumber = search.createColumn({ name: 'custrecord_tkio_wetrack_lot_number' });
                const customrecord_tkio_wetrack_epcis_transactSearchColLotLocation = search.createColumn({ name: 'custrecord_tkio_lot_location' });
                const customrecord_tkio_wetrack_epcis_transactSearchColItem = search.createColumn({ name: 'custrecord_wetrack_gtin' });
                const customrecord_tkio_wetrack_epcis_transactSearchColSenderSgln = search.createColumn({ name: 'custrecord_tkio_wetrack_sgln' });
                const customrecord_tkio_wetrack_epcis_transactSearchColReceiverSgln = search.createColumn({ name: 'custrecord_tkio_receiver_sgln' });
                const customrecord_tkio_wetrack_epcis_transactSearchColShipmentDate = search.createColumn({ name: 'custrecord_tkio_shipment_date' });
                const customrecord_tkio_wetrack_epcis_transactSearchColLevel1 = search.createColumn({ name: 'custrecord_tkio_wetrack_level_1' });
                const customrecord_tkio_wetrack_epcis_transactSearchColLevel2 = search.createColumn({ name: 'custrecord_tkio_wetrack_level_2' });
                const customrecord_tkio_wetrack_epcis_transactSearchColLevel3 = search.createColumn({ name: 'custrecord_tkio_wetrack_level_3' });
                const customrecord_tkio_wetrack_epcis_transactSearchColLotIsSuspicious = search.createColumn({ name: 'custrecord_tkio_lot_is_suspicious' });
                const customrecord_tkio_wetrack_epcis_transactSearchColIsInQuarantine = search.createColumn({ name: 'custrecord_tkio_is_in_quarantine' });
                const customrecord_tkio_wetrack_epcis_transactSearchColSenderOfLocationSgln = search.createColumn({ name: 'custrecord_tkio_sender_loc_sgln' });
                const customrecord_tkio_wetrack_epcis_transactSearchColReceiverOfLocationSgln = search.createColumn({ name: 'custrecord_tkio_receiver_loc_sgln' });
                const customrecord_tkio_wetrack_epcis_transactSearchColTransactionInformationIdRelated = search.createColumn({ name: 'custrecord_wetrack_ti_id_related' });
                const customrecord_tkio_wetrack_epcis_transactSearchColSuitetraceGrouping = search.createColumn({ name: 'custrecord_tkio_suitetrace_grouping' });
                const customrecord_tkio_wetrack_epcis_transactSearchColProductName = search.createColumn({ name: 'custrecord_tkio_suitetrace_item_name' });
                const customrecord_tkio_wetrack_epcis_transactSearchColManufacturertraderName = search.createColumn({ name: 'custrecord_tkio_suitetrace_mt_name' });
                const customrecord_tkio_wetrack_epcis_transactSearchColDosage = search.createColumn({ name: 'custrecord_tkio_suitetrace_dosage' });
                const customrecord_tkio_wetrack_epcis_transactSearchColStrength = search.createColumn({ name: 'custrecord_tkio_suitetrace_strength' });
                const customrecord_tkio_wetrack_epcis_transactSearchColContainerSize = search.createColumn({ name: 'custrecord_tkio_suitetrace_container_sz' });
                const customrecord_tkio_wetrack_epcis_transactSearchColExpirationDate = search.createColumn({ name: 'custrecord_tkio_suitetrace_expiry_date' });
                const customrecord_tkio_wetrack_epcis_transactSearchColSenderName = search.createColumn({ name: 'custrecord_tkio_suitetrace_sender_name' });
                const customrecord_tkio_wetrack_epcis_transactSearchColSenderStreetAddressOne = search.createColumn({ name: 'custrecord_tkio_suitetrace_sender_addr1' });
                const customrecord_tkio_wetrack_epcis_transactSearchColSenderStreetAddressTwo = search.createColumn({ name: 'custrecord_tkio_suitetrace_sender_addr2' });
                const customrecord_tkio_wetrack_epcis_transactSearchColSenderCity = search.createColumn({ name: 'custrecord_tkio_suitetrace_sender_city' });
                const customrecord_tkio_wetrack_epcis_transactSearchColSenderState = search.createColumn({ name: 'custrecord_tkio_suitetrace_sender_state' });
                const customrecord_tkio_wetrack_epcis_transactSearchColSenderPostalCode = search.createColumn({ name: 'custrecord_tkio_suitetrace_sender_pc' });
                const customrecord_tkio_wetrack_epcis_transactSearchColSenderCountryCode = search.createColumn({ name: 'custrecord_tko_suitetrace_sender_cc' });
                const customrecord_tkio_wetrack_epcis_transactSearchColReceiverName = search.createColumn({ name: 'custrecord_tkio_suitetrace_rec_name' });
                const customrecord_tkio_wetrack_epcis_transactSearchColReceiverStreetAddressOne = search.createColumn({ name: 'custrecord_tkio_suitetrace_rec_addr1' });
                const customrecord_tkio_wetrack_epcis_transactSearchColReceiverStreetAddressTwo = search.createColumn({ name: 'custrecord_tkio_suitetrace_rec_addr2' });
                const customrecord_tkio_wetrack_epcis_transactSearchColReceiverCity = search.createColumn({ name: 'custrecord_tkio_suitetrace_rec_city' });
                const customrecord_tkio_wetrack_epcis_transactSearchColReceiverState = search.createColumn({ name: 'custrecord_tkio_suitetrace_rec_state' });
                const customrecord_tkio_wetrack_epcis_transactSearchColReceiverCountryCode = search.createColumn({ name: 'custrecord_tkio_suitetrace_rec_cc' });
                const customrecord_tkio_wetrack_epcis_transactSearchColSenderLocationName = search.createColumn({ name: 'custrecord_tkio_suitetrace_sen_loc_name' });
                const customrecord_tkio_wetrack_epcis_transactSearchColSenderLocationAddressOne = search.createColumn({ name: 'custrecord_tkio_suitetrace_sen_loc_addr1' });
                const customrecord_tkio_wetrack_epcis_transactSearchColSenderLocationAddressTwo = search.createColumn({ name: 'custrecord_tkio_suitetrace_sen_loc_addr2' });
                const customrecord_tkio_wetrack_epcis_transactSearchColSenderLocationCity = search.createColumn({ name: 'custrecord_tkio_suitetrace_sen_loc_city' });
                const customrecord_tkio_wetrack_epcis_transactSearchColSenderLocationState = search.createColumn({ name: 'custrecord_tkio_suitetrace_sen_loc_state' });
                const customrecord_tkio_wetrack_epcis_transactSearchColSenderLocationPostalCode = search.createColumn({ name: 'custrecord_tkio_suitetrace_sen_loc_pc' });
                const customrecord_tkio_wetrack_epcis_transactSearchColSenderLocationCountryCode = search.createColumn({ name: 'custrecord_tkio_suitetrace_sen_loc_cc' });
                const customrecord_tkio_wetrack_epcis_transactSearchColReceiverLocationName = search.createColumn({ name: 'custrecord_tkio_suitetrace_rec_loc_name' });
                const customrecord_tkio_wetrack_epcis_transactSearchColReceiverLocationAddressOne = search.createColumn({ name: 'custrecord_tkio_suitetrace_rec_loc_addr1' });
                const customrecord_tkio_wetrack_epcis_transactSearchColReceiverLocationAddressTwo = search.createColumn({ name: 'custrecord_tkio_suitetrace_rec_loc_addr2' });
                const customrecord_tkio_wetrack_epcis_transactSearchColReceiverLocationCity = search.createColumn({ name: 'custrecord_tkio_suitetrace_rec_loc_city' });
                const customrecord_tkio_wetrack_epcis_transactSearchColReceiverLocationState = search.createColumn({ name: 'custrecord_tkio_suitetrace_rec_loc_state' });
                const customrecord_tkio_wetrack_epcis_transactSearchColReceiverLocationPostalCode = search.createColumn({ name: 'custrecord_tkio_suitetrace_rec_loc_pc' });
                const customrecord_tkio_wetrack_epcis_transactSearchColReceiverLocationCountryCode = search.createColumn({ name: 'custrecord_tkio_suitetrace_rec_loc_cc' });
                const customrecord_tkio_wetrack_epcis_transactSearchColEpcisFile = search.createColumn({ name: 'custrecord_tkio_suitetrace_epcis_file' });
                const customrecord_tkio_wetrack_epcis_transactSearchColTransactionStatement = search.createColumn({ name: 'custrecord_tkio_suitetrace_ts' });
                const customrecord_tkio_wetrack_epcis_transactSearchColFile = search.createColumn({ name: 'custrecord_tkio_suitetrace_gr_file', join: 'CUSTRECORD_TKIO_SUITETRACE_GROUPING' });
                const customrecord_tkio_wetrack_epcis_transactSearchColHasError = search.createColumn({ name: 'custrecord_tkio_suitetrace_has_error', join: 'CUSTRECORD_TKIO_SUITETRACE_GROUPING' });
                const customrecord_tkio_wetrack_epcis_transactSearchColProcessStatus = search.createColumn({ name: 'custrecord_tkio_suitetrace_proc_status', join: 'CUSTRECORD_TKIO_SUITETRACE_GROUPING' });
                const customrecord_tkio_wetrack_epcis_transactSearchColLogMessages = search.createColumn({ name: 'custrecord_tkio_suitetrace_log_msg', join: 'CUSTRECORD_TKIO_SUITETRACE_GROUPING' });
                const customrecord_tkio_wetrack_epcis_transactSearchColGln = search.createColumn({ name: 'custrecord_tkio_suitetrace_grp_gln', join: 'CUSTRECORD_TKIO_SUITETRACE_GROUPING' });
                const customrecord_tkio_wetrack_epcis_transactSearchColCustrecordTkioSuitetraceGroupingCustrecordTkioSuitetraceHasError = search.createColumn({ name: 'custrecord_tkio_suitetrace_has_error', join: 'CUSTRECORD_TKIO_SUITETRACE_GROUPING' });
                const customrecord_tkio_wetrack_epcis_transactSearchColLogMessageInternal = search.createColumn({ name: 'custrecord_tkio_suitetrace_log_msg_inter', join: 'CUSTRECORD_TKIO_SUITETRACE_GROUPING' });
                const customrecord_tkio_wetrack_epcis_transactSearchColSuitetraceEmailOfLocation = search.createColumn({ name: 'custrecord_tkio_suitetrace_grp_email', join: 'CUSTRECORD_TKIO_SUITETRACE_GROUPING' });
                const customrecord_tkio_wetrack_epcis_transactSearchColSgtin = search.createColumn({ name: 'custrecord_tkio_sgtin' });
                const customrecord_tkio_wetrack_epcis_transactSearchColPurchaseOrdersHistory = search.createColumn({ name: 'custrecord_tkio_po_history' });
                const customrecord_tkio_wetrack_epcis_transactSearchColInternalId = search.createColumn({ name: 'internalid' });
                const customrecord_tkio_wetrack_epcis_transactSearchColIsInternalMovement = search.createColumn({ name: 'custrecord_tkio_internal_movement' });
                const customrecord_tkio_wetrack_epcis_transactSearchColInventoryDetail = search.createColumn({ name: 'custrecord_st_inventory_detail' });
                const customrecord_tkio_wetrack_epcis_transactSearchColType = search.createColumn({ name: 'type', join: 'CUSTRECORD_ST_SOURCE_TRANSACTION' });
                const customrecord_tkio_wetrack_epcis_transactSearchColSourceTransaction = search.createColumn({ name: 'custrecord_st_source_transaction' });
                const customrecord_tkio_wetrack_epcis_transactSearchColQuantity = search.createColumn({ name: 'quantity', join: 'CUSTRECORD_ST_SOURCE_TRANSACTION' });



                const customrecord_tkio_wetrack_epcis_transactSearch = search.create({
                    type: 'customrecord_tkio_wetrack_epcis_transact',
                    filters: [
                        ['isinactive', 'is', 'F'],
                        'AND',
                        ['custrecord_tkio_suitetrace_grouping.isinactive', 'is', 'F'],
                    ],
                    columns: [

                        customrecord_tkio_wetrack_epcis_transactSearchColDateCreated,
                        customrecord_tkio_wetrack_epcis_transactSearchColIsThFromFile,
                        customrecord_tkio_wetrack_epcis_transactSearchColTransaction,
                        customrecord_tkio_wetrack_epcis_transactSearchColLotNumber,
                        customrecord_tkio_wetrack_epcis_transactSearchColLotLocation,
                        customrecord_tkio_wetrack_epcis_transactSearchColItem,
                        customrecord_tkio_wetrack_epcis_transactSearchColSenderSgln,
                        customrecord_tkio_wetrack_epcis_transactSearchColReceiverSgln,
                        customrecord_tkio_wetrack_epcis_transactSearchColShipmentDate,
                        customrecord_tkio_wetrack_epcis_transactSearchColLevel1,
                        customrecord_tkio_wetrack_epcis_transactSearchColLevel2,
                        customrecord_tkio_wetrack_epcis_transactSearchColLevel3,
                        customrecord_tkio_wetrack_epcis_transactSearchColLotIsSuspicious,
                        customrecord_tkio_wetrack_epcis_transactSearchColIsInQuarantine,
                        customrecord_tkio_wetrack_epcis_transactSearchColSenderOfLocationSgln,
                        customrecord_tkio_wetrack_epcis_transactSearchColReceiverOfLocationSgln,
                        customrecord_tkio_wetrack_epcis_transactSearchColTransactionInformationIdRelated,
                        customrecord_tkio_wetrack_epcis_transactSearchColSuitetraceGrouping,
                        customrecord_tkio_wetrack_epcis_transactSearchColProductName,
                        customrecord_tkio_wetrack_epcis_transactSearchColManufacturertraderName,
                        customrecord_tkio_wetrack_epcis_transactSearchColDosage,
                        customrecord_tkio_wetrack_epcis_transactSearchColStrength,
                        customrecord_tkio_wetrack_epcis_transactSearchColContainerSize,
                        customrecord_tkio_wetrack_epcis_transactSearchColExpirationDate,
                        customrecord_tkio_wetrack_epcis_transactSearchColSenderName,
                        customrecord_tkio_wetrack_epcis_transactSearchColSenderStreetAddressOne,
                        customrecord_tkio_wetrack_epcis_transactSearchColSenderStreetAddressTwo,
                        customrecord_tkio_wetrack_epcis_transactSearchColSenderCity,
                        customrecord_tkio_wetrack_epcis_transactSearchColSenderState,
                        customrecord_tkio_wetrack_epcis_transactSearchColSenderPostalCode,
                        customrecord_tkio_wetrack_epcis_transactSearchColSenderCountryCode,
                        customrecord_tkio_wetrack_epcis_transactSearchColReceiverName,
                        customrecord_tkio_wetrack_epcis_transactSearchColReceiverStreetAddressOne,
                        customrecord_tkio_wetrack_epcis_transactSearchColReceiverStreetAddressTwo,
                        customrecord_tkio_wetrack_epcis_transactSearchColReceiverCity,
                        customrecord_tkio_wetrack_epcis_transactSearchColReceiverState,
                        customrecord_tkio_wetrack_epcis_transactSearchColReceiverCountryCode,
                        customrecord_tkio_wetrack_epcis_transactSearchColSenderLocationName,
                        customrecord_tkio_wetrack_epcis_transactSearchColSenderLocationAddressOne,
                        customrecord_tkio_wetrack_epcis_transactSearchColSenderLocationAddressTwo,
                        customrecord_tkio_wetrack_epcis_transactSearchColSenderLocationCity,
                        customrecord_tkio_wetrack_epcis_transactSearchColSenderLocationState,
                        customrecord_tkio_wetrack_epcis_transactSearchColSenderLocationPostalCode,
                        customrecord_tkio_wetrack_epcis_transactSearchColSenderLocationCountryCode,
                        customrecord_tkio_wetrack_epcis_transactSearchColReceiverLocationName,
                        customrecord_tkio_wetrack_epcis_transactSearchColReceiverLocationAddressOne,
                        customrecord_tkio_wetrack_epcis_transactSearchColReceiverLocationAddressTwo,
                        customrecord_tkio_wetrack_epcis_transactSearchColReceiverLocationCity,
                        customrecord_tkio_wetrack_epcis_transactSearchColReceiverLocationState,
                        customrecord_tkio_wetrack_epcis_transactSearchColReceiverLocationPostalCode,
                        customrecord_tkio_wetrack_epcis_transactSearchColReceiverLocationCountryCode,
                        customrecord_tkio_wetrack_epcis_transactSearchColEpcisFile,
                        customrecord_tkio_wetrack_epcis_transactSearchColTransactionStatement,
                        customrecord_tkio_wetrack_epcis_transactSearchColFile,
                        customrecord_tkio_wetrack_epcis_transactSearchColHasError,
                        customrecord_tkio_wetrack_epcis_transactSearchColProcessStatus,
                        customrecord_tkio_wetrack_epcis_transactSearchColLogMessages,
                        customrecord_tkio_wetrack_epcis_transactSearchColGln,
                        customrecord_tkio_wetrack_epcis_transactSearchColCustrecordTkioSuitetraceGroupingCustrecordTkioSuitetraceHasError,
                        customrecord_tkio_wetrack_epcis_transactSearchColLogMessageInternal,
                        customrecord_tkio_wetrack_epcis_transactSearchColSuitetraceEmailOfLocation,
                        customrecord_tkio_wetrack_epcis_transactSearchColSgtin,
                        customrecord_tkio_wetrack_epcis_transactSearchColPurchaseOrdersHistory,
                        customrecord_tkio_wetrack_epcis_transactSearchColInternalId,
                        customrecord_tkio_wetrack_epcis_transactSearchColIsInternalMovement,
                        customrecord_tkio_wetrack_epcis_transactSearchColInventoryDetail,
                        customrecord_tkio_wetrack_epcis_transactSearchColType,
                        customrecord_tkio_wetrack_epcis_transactSearchColSourceTransaction,
                        customrecord_tkio_wetrack_epcis_transactSearchColQuantity
                    ],
                });
                // Note: Search.run() is limited to 4,000 results
                // customrecord_tkio_wetrack_epcis_transactSearch.run().each((result: search.Result): boolean => {
                //   return true;
                // });
                const customrecord_tkio_wetrack_epcis_transactSearchPagedData = customrecord_tkio_wetrack_epcis_transactSearch.runPaged({ pageSize: 1000 });
                for (let i = 0; i < customrecord_tkio_wetrack_epcis_transactSearchPagedData.pageRanges.length; i++) {
                    const customrecord_tkio_wetrack_epcis_transactSearchPage = customrecord_tkio_wetrack_epcis_transactSearchPagedData.fetch({ index: i });
                    customrecord_tkio_wetrack_epcis_transactSearchPage.data.forEach((result) => {
                        const dateCreated = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColDateCreated);
                        const isThFromFile = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColIsThFromFile);
                        const transaction = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColTransaction);
                        const transaction_text = result.getText(customrecord_tkio_wetrack_epcis_transactSearchColTransaction);
                        const lotNumber = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColLotNumber);
                        const lotLocation = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColLotLocation);
                        const item = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColItem);
                        const item_ndc = result.getText(customrecord_tkio_wetrack_epcis_transactSearchColItem);
                        const senderSgln = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColSenderSgln);
                        const receiverSgln = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColReceiverSgln);
                        const shipmentDate = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColShipmentDate);
                        const level1 = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColLevel1);
                        const level2 = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColLevel2);
                        const level3 = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColLevel3);
                        const lotIsSuspicious = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColLotIsSuspicious);
                        const isInQuarantine = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColIsInQuarantine);
                        const senderOfLocationSgln = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColSenderOfLocationSgln);
                        const receiverOfLocationSgln = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColReceiverOfLocationSgln);
                        const transactionInformationIdRelated = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColTransactionInformationIdRelated);
                        const suitetraceGrouping = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColSuitetraceGrouping);
                        const productName = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColProductName);
                        const manufacturertraderName = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColManufacturertraderName);
                        const dosage = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColDosage);
                        const strength = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColStrength);
                        const containerSize = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColContainerSize);
                        const expirationDate = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColExpirationDate);
                        const senderName = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColSenderName);
                        const senderStreetAddressOne = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColSenderStreetAddressOne);
                        const senderStreetAddressTwo = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColSenderStreetAddressTwo);
                        const senderCity = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColSenderCity);
                        const senderState = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColSenderState);
                        const senderPostalCode = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColSenderPostalCode);
                        const senderCountryCode = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColSenderCountryCode);
                        const receiverName = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColReceiverName);
                        const receiverStreetAddressOne = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColReceiverStreetAddressOne);
                        const receiverStreetAddressTwo = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColReceiverStreetAddressTwo);
                        const receiverCity = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColReceiverCity);
                        const receiverState = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColReceiverState);
                        const receiverCountryCode = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColReceiverCountryCode);
                        const senderLocationName = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColSenderLocationName);
                        const senderLocationAddressOne = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColSenderLocationAddressOne);
                        const senderLocationAddressTwo = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColSenderLocationAddressTwo);
                        const senderLocationCity = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColSenderLocationCity);
                        const senderLocationState = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColSenderLocationState);
                        const senderLocationPostalCode = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColSenderLocationPostalCode);
                        const senderLocationCountryCode = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColSenderLocationCountryCode);
                        const receiverLocationName = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColReceiverLocationName);
                        const receiverLocationAddressOne = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColReceiverLocationAddressOne);
                        const receiverLocationAddressTwo = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColReceiverLocationAddressTwo);
                        const receiverLocationCity = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColReceiverLocationCity);
                        const receiverLocationState = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColReceiverLocationState);
                        const receiverLocationPostalCode = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColReceiverLocationPostalCode);
                        const receiverLocationCountryCode = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColReceiverLocationCountryCode);
                        const epcisFile = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColEpcisFile);
                        const transactionStatement = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColTransactionStatement);
                        const file = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColFile);
                        const hasError = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColHasError);
                        const processStatus = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColProcessStatus);
                        const logMessages = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColLogMessages);
                        const gln = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColGln);
                        const custrecordTkioSuitetraceGroupingCustrecordTkioSuitetraceHasError = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColCustrecordTkioSuitetraceGroupingCustrecordTkioSuitetraceHasError);
                        const logMessageInternal = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColLogMessageInternal);
                        const suitetraceEmailOfLocation = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColSuitetraceEmailOfLocation);
                        const sgtin = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColSgtin);
                        const purchaseOrdersHistory = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColPurchaseOrdersHistory);
                        const internalId = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColInternalId);
                        const isInternalMovement = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColIsInternalMovement);
                        const inventoryDetail = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColInventoryDetail);
                        const type = result.getText(customrecord_tkio_wetrack_epcis_transactSearchColType);
                        const sourceTransaction = result.getText(customrecord_tkio_wetrack_epcis_transactSearchColSourceTransaction);
                        const quantity = result.getValue(customrecord_tkio_wetrack_epcis_transactSearchColQuantity);


                        data_array.push(
                            {
                                quantity,
                                inventoryDetail,
                                sourceTransaction,
                                type,
                                isInternalMovement,
                                internalId,
                                purchaseOrdersHistory,
                                sgtin,
                                dateCreated,
                                isThFromFile,
                                transaction,
                                transaction_text,
                                lotNumber,
                                lotLocation,
                                item,
                                item_ndc,
                                senderSgln,
                                receiverSgln,
                                shipmentDate,
                                level1,
                                level2,
                                level3,
                                lotIsSuspicious,
                                isInQuarantine,
                                senderOfLocationSgln,
                                receiverOfLocationSgln,
                                transactionInformationIdRelated,
                                suitetraceGrouping,
                                productName,
                                manufacturertraderName,
                                dosage,
                                strength,
                                containerSize,
                                expirationDate,
                                senderName,
                                senderStreetAddressOne,
                                senderStreetAddressTwo,
                                senderCity,
                                senderState,
                                senderPostalCode,
                                senderCountryCode,
                                receiverName,
                                receiverStreetAddressOne,
                                receiverStreetAddressTwo,
                                receiverCity,
                                receiverState,
                                receiverCountryCode,
                                senderLocationName,
                                senderLocationAddressOne,
                                senderLocationAddressTwo,
                                senderLocationCity,
                                senderLocationState,
                                senderLocationPostalCode,
                                senderLocationCountryCode,
                                receiverLocationName,
                                receiverLocationAddressOne,
                                receiverLocationAddressTwo,
                                receiverLocationCity,
                                receiverLocationState,
                                receiverLocationPostalCode,
                                receiverLocationCountryCode,
                                epcisFile,
                                transactionStatement,
                                file,
                                hasError,
                                processStatus,
                                logMessages,
                                gln,
                                custrecordTkioSuitetraceGroupingCustrecordTkioSuitetraceHasError,
                                logMessageInternal,
                                suitetraceEmailOfLocation

                            }
                        )
                    });
                }
                // const reducedData = data_array.reduce((accumulator, currentItem) => {
                //     const {
                //         sgtin,
                //         dateCreated,
                //         isThFromFile,
                //         transaction,
                //         transaction_text,
                //         lotNumber,
                //         lotLocation,
                //         item,
                //         item_ndc,
                //         senderSgln,
                //         receiverSgln,
                //         shipmentDate,
                //         level1,
                //         level2,
                //         level3,
                //         lotIsSuspicious,
                //         isInQuarantine,
                //         senderOfLocationSgln,
                //         receiverOfLocationSgln,
                //         transactionInformationIdRelated,
                //         suitetraceGrouping,
                //         productName,
                //         manufacturertraderName,
                //         dosage,
                //         strength,
                //         containerSize,
                //         expirationDate,
                //         senderName,
                //         senderStreetAddressOne,
                //         senderStreetAddressTwo,
                //         senderCity,
                //         senderState,
                //         senderPostalCode,
                //         senderCountryCode,
                //         receiverName,
                //         receiverStreetAddressOne,
                //         receiverStreetAddressTwo,
                //         receiverCity,
                //         receiverState,
                //         receiverCountryCode,
                //         senderLocationName,
                //         senderLocationAddressOne,
                //         senderLocationAddressTwo,
                //         senderLocationCity,
                //         senderLocationState,
                //         senderLocationPostalCode,
                //         senderLocationCountryCode,
                //         receiverLocationName,
                //         receiverLocationAddressOne,
                //         receiverLocationAddressTwo,
                //         receiverLocationCity,
                //         receiverLocationState,
                //         receiverLocationPostalCode,
                //         receiverLocationCountryCode,
                //         epcisFile,
                //         transactionStatement,
                //         file,
                //         hasError,
                //         processStatus,
                //         logMessages,
                //         gln,
                //         custrecordTkioSuitetraceGroupingCustrecordTkioSuitetraceHasError,
                //         logMessageInternal,
                //         suitetraceEmailOfLocation
                //     } = currentItem;
                //     // const { suitetraceGrouping, transaction, sgtin, item_ndc } = currentItem;
                //     const key = `${suitetraceGrouping}-${transaction}-${sgtin}-${item_ndc}`;

                //     if (!accumulator[key]) {
                //         accumulator[key] = {
                //             sgtin,
                //             dateCreated,
                //             isThFromFile,
                //             transaction,
                //             transaction_text,
                //             lotNumber,
                //             lotLocation,
                //             item,
                //             item_ndc,
                //             senderSgln,
                //             receiverSgln,
                //             shipmentDate,
                //             level1,
                //             level2,
                //             level3,
                //             lotIsSuspicious,
                //             isInQuarantine,
                //             senderOfLocationSgln,
                //             receiverOfLocationSgln,
                //             transactionInformationIdRelated,
                //             suitetraceGrouping,
                //             productName,
                //             manufacturertraderName,
                //             dosage,
                //             strength,
                //             containerSize,
                //             expirationDate,
                //             senderName,
                //             senderStreetAddressOne,
                //             senderStreetAddressTwo,
                //             senderCity,
                //             senderState,
                //             senderPostalCode,
                //             senderCountryCode,
                //             receiverName,
                //             receiverStreetAddressOne,
                //             receiverStreetAddressTwo,
                //             receiverCity,
                //             receiverState,
                //             receiverCountryCode,
                //             senderLocationName,
                //             senderLocationAddressOne,
                //             senderLocationAddressTwo,
                //             senderLocationCity,
                //             senderLocationState,
                //             senderLocationPostalCode,
                //             senderLocationCountryCode,
                //             receiverLocationName,
                //             receiverLocationAddressOne,
                //             receiverLocationAddressTwo,
                //             receiverLocationCity,
                //             receiverLocationState,
                //             receiverLocationPostalCode,
                //             receiverLocationCountryCode,
                //             epcisFile,
                //             transactionStatement,
                //             file,
                //             hasError,
                //             processStatus,
                //             logMessages,
                //             gln,
                //             custrecordTkioSuitetraceGroupingCustrecordTkioSuitetraceHasError,
                //             logMessageInternal,
                //             suitetraceEmailOfLocation
                //         };
                //     }

                //     return accumulator;
                // }, {});

                // const reducedArray = Object.values(reducedData);
                let aux = []

                data_array.forEach(element => {
                    if (element.isThFromFile === false && element.suitetraceGrouping !== '' && element.transaction !== '') {
                        let data_to_push = {
                            date_upload:element.dateCreated,
                            purchase_order_id: element.transaction,
                            purchase_orders:element.transaction_text,
                            status_error:element.hasError,
                            transaction_statement: element.transactionStatement,
                            sender_name:element.senderName,
                            sender_SGLN:element.senderSgln,
                            sender_location_name:element.senderLocationName,
                            sender_location_address:element.senderLocationAddressOne+', '+element.senderLocationAddressTwo+', '+element.senderLocationPostalCode+', '+element.senderLocationCity+', '+element.senderLocationState+','+element.senderLocationCountryCode,
                            receiver_location_name:element.receiverLocationName,
                            receiver_location_address:element.receiverLocationAddressOne+', '+element.receiverLocationAddressTwo+', '+element.receiverLocationPostalCode+', '+element.receiverLocationCity+', '+element.receiverLocationState+','+element.receiverLocationCountryCode,
                            shipment_date:element.shipmentDate,
                            grouping: element.suitetraceGrouping,
                            logMessages:element.logMessages,
                            items_info: [],
                        }
                        const existingItem = aux.find(item => item.purchase_order_id === element.transaction && item.grouping === element.suitetraceGrouping);
                        if (!existingItem) {
                            aux.push(data_to_push)
                        }
                    }
                });
                log.emergency({
                    title: "AUX length",
                    details: aux.length
                })
                
                aux.forEach(element => {
                    data_array.forEach(data => {
                        if (element.purchase_order_id === data.transaction && element.grouping === data.suitetraceGrouping && data.isThFromFile === false && data.sgtin !== '' &&data.isInternalMovement === false) {
                            let data_to_push = {
                                sgtin: data.sgtin.split(":")[4],
                                ndc: data.item_ndc,
                                product_name: data.productName,
                                dosage: data.dosage,
                                strength: data.strength,
                                container_size: data.containerSize,
                                lot_number: data.lotNumber,
                                level_1: data.level1 !== '' ? data.level1.split(":")[4] : '',
                                level_2: data.level2 !== '' ? data.level2.split(":")[4] : '',
                                level_3: data.level3 !== '' ? data.level3.split(":")[4] : '',
                                trans_hist: [],
                                receipts:[]
                            }
                            const existingItem = element.items_info.find(item => item.sgtin === data_to_push.sgtin && item.ndc === data_to_push.ndc);

                            if (!existingItem) {
                                element.items_info.push(data_to_push)
                            }
                        }
                    })
                });
                aux.forEach(element=>{
                    data_array.forEach(data=>{
                        element.items_info.forEach(info => {
                            if(info.ndc===data.item_ndc){

                                if(element.purchase_order_id===data.transaction && data.isInternalMovement === true){
                                    let data_to_push={
                                        tranid:data.sourceTransaction,
                                        item: data.item_ndc,
                                        quantity:data.quantity,
                                        trandate:data.shipmentDate, 
                                        recordtype:data.type,
                                        sender_location_address:data.senderLocationAddressOne+', '+data.senderLocationAddressTwo+', '+data.senderLocationPostalCode+', '+data.senderLocationCity+', '+data.senderLocationState+','+data.senderLocationCountryCode,
                                        receiver_location_address:data.receiverLocationAddressOne+', '+data.receiverLocationAddressTwo+', '+data.receiverLocationPostalCode+', '+data.receiverLocationCity+', '+data.receiverLocationState+','+data.receiverLocationCountryCode,
                                        product_name: data.productName,
                                        dosage: data.dosage,
                                        strength: data.strength,
                                        container_size: data.containerSize,
                                        sender_name:data.senderName,
                                        receiver_name:data.receiverName
                                    }
                                    info.receipts.push(data_to_push)
        
                                    // const existingItem = element.item_receipts.find(item => item.sgtin === data_to_push.sgtin && item.ndc === data_to_push.ndc);
        
                                }
                            }
                        })
                    })
                })
                aux.forEach(element => {
                    data_array.forEach(data => {
                        element.items_info.forEach(info => {
                            if (element.grouping === data.suitetraceGrouping && data.isThFromFile === true && info.sgtin === data.sgtin.split(":")[4]) {
                                let data_to_push = {
                                    shipment_date:data.shipmentDate,

                                    sgtin: data.sgtin.split(":")[4],
                                    ndc: data.item_ndc,
                                    purchase_orders_th: data.purchaseOrdersHistory,
                                    product_name: data.productName,
                                    dosage: data.dosage,
                                    strength: data.strength,
                                    container_size: data.containerSize,
                                    lot_number: data.lotNumber,
                                    level_1: data.level1 !== '' ? data.level1.split(":")[4] : '',
                                    level_2: data.level2 !== '' ? data.level2.split(":")[4] : '',
                                    level_3: data.level3 !== '' ? data.level3.split(":")[4] : '',

                                    sender_name:data.senderName,
                                    sender_SGLN:data.senderSgln,
                                    sender_street_addr1:data.senderStreetAddressOne,
                                    sender_street_addr2:data.senderStreetAddressTwo,
                                    sender_city:data.senderCity,
                                    sender_state:data.senderState,
                                    sender_postalCode:data.senderPostalCode,
                                    sender_countryCode:data.senderCountryCode,
                                    sender_loc_name:data.senderLocationName,
                                    sender_loc_street_addr1:data.senderLocationAddressOne,
                                    sender_loc_street_addr2:data.senderLocationAddressTwo,
                                    sender_loc_city:data.senderLocationCity,
                                    sender_loc_state:data.senderLocationState,
                                    sender_loc_postalCode:data.senderLocationPostalCode,
                                    sender_loc_countryCod:data.senderLocationCountryCode,


                                    receiver_name:data.receiverName,
                                    receiver_SGLN:data.receiverSgln,
                                    receiver_street_addr1:data.receiverStreetAddressOne,
                                    receiver_street_addr2:data.receiverStreetAddressTwo,
                                    receiver_city:data.receiverCity,
                                    receiver_state:data.receiverState,
                                    receiver_postalCode:data.receiverCountryCode,
                                    receiver_countryCode:data.receiverCountryCode,
                                    receiver_loc_name:data.receiverLocationName,
                                    receiver_loc_street_addr1:data.receiverLocationAddressOne,
                                    receiver_loc_street_addr2:data.receiverLocationAddressTwo,
                                    receiver_loc_city:data.receiverLocationCity,
                                    receiver_loc_state:data.receiverLocationState,
                                    receiver_loc_postalCode:data.receiverLocationPostalCode,
                                    receiver_loc_countryCode:data.receiverLocationCountryCode,

                                }
                                const existingItem = info.trans_hist.find(item => item.sgtin === data_to_push.sgtin && item.ndc === data_to_push.ndc);
                                if (!existingItem) {
                                    info.trans_hist.push(data_to_push)
                                }
                            }
                        })

                    })
                });
               
                



                return aux;

            } catch (err) {
                log.error({ title: 'Error occurred in search3ts', details: err });
            }
        }
        const track_query = () => {
            try {
                var querystr = 'SELECT TRANSACTION.TRANID, TransactionLine.createdfrom, TransactionLine.Subsidiary, Subsidiary.fullname,' +
                    'item.id, item.itemid, item.displayname, TransactionLine.Quantity, TRANSACTION.trandate, ' +
                    'TRANSACTION.Entity, ENTITY.entityid, TransactionLine.location, ' +
                    'Location.NAME, item.DISPLAYNAME, inventoryassignment.inventorynumber, inventoryassignment.quantity, inventoryassignment.ID, ' +
                    'TransactionLine.units, unitstype.name,  TRANSACTION.ID, TRANSACTION.recordtype, TRANSACTION.custbody_atlas_inv_adj_reason, ' +
                    'TRANSACTION.Status, inventoryassignment.transactionline, TransactionLine.ID  ' +
                    'FROM TransactionLine ' +
                    'INNER JOIN TRANSACTION ON TRANSACTION.ID = TransactionLine.TRANSACTION ' +
                    'INNER JOIN item ON item.id = TransactionLine.ITEM ' +
                    'INNER JOIN Subsidiary ON Subsidiary.ID = TransactionLine.Subsidiary ' +
                    //'INNER JOIN inventoryassignment  ON inventoryassignment.transactionline  = TransactionLine.ID ' +
                    'INNER JOIN inventoryassignment  ON inventoryassignment.TRANSACTION  = TRANSACTION.ID ' +
                    'LEFT JOIN ENTITY ON TRANSACTION.Entity = ENTITY.id ' +
                    'LEFT JOIN Location ON Location.id = TransactionLine.location ' +
                    'LEFT JOIN customrecord_atlas_inv_adj_reasn ON customrecord_atlas_inv_adj_reasn.id = TRANSACTION.custbody_atlas_inv_adj_reason ' +
                    'LEFT JOIN unitstype ON unitstype.id = TransactionLine.units ' +
                    'WHERE ((TRANSACTION.recordtype = ? ' +
                    'AND (TRANSACTION.Status = ? ' +
                    'OR TRANSACTION.Status = ? ' +
                    'OR TRANSACTION.Status = ? ' +
                    'OR TRANSACTION.Status = ? ' +
                    'OR TRANSACTION.Status = ? ' +
                    'OR TRANSACTION.Status = ? )' +
                    'OR TRANSACTION.recordtype = ? ' +
                    'OR TRANSACTION.recordtype = ? ' +
                    'OR TRANSACTION.recordtype = ?)) ';
                var results = query.runSuiteQL({
                    query: querystr,
                    params: ['salesorder', 'B', 'D', 'E', 'F', 'G', 'H', 'itemfulfillment', 'inventoryadjustment', 'itemreceipt'],
                    customScriptId: 'customscript_fb_query_sl'
                });

                // log.debug({title: 'track_query columns', details: results.columns});
                // log.debug({title: 'track_query types', details: results.types});

                let parsed_results = parseResults(results);
                return parsed_results;

            } catch (error) {
                log.error({ title: 'track_query', details: error });
            }
        }
        const parseResults = (results) => {
            try {
                var resultsarray = [];
                for (var i in results.results) {
                    var row = results.results[i].values;
                    var data = {};
                    data['id'] = row[19];
                    data['tranid'] = row[0];
                    data['tranid_createdfrom'] = row[1];
                    data['subsidiary_id'] = row[2];
                    data['subsidiary'] = row[3];
                    data['item_id'] = row[4];
                    data['item'] = row[5];
                    data['displayname_item'] = row[6];
                    data['quantity'] = row[7];
                    data['trandate'] = row[8];
                    data['entity'] = row[10];
                    data['location'] = row[12];
                    data['location_id'] = row[11];
                    data['inventorynumber_inventorydetail_id'] = row[16];
                    data['inventorynumber_inventorydetail'] = row[14];
                    data['quantity_inventorydetail'] = row[15];
                    data['recordtype'] = row[20];
                    data['formulatext'] = row[0];
                    data['unit'] = row[0];
                    data['address_vendor'] = row[0];
                    data['custbody_atlas_inv_adj_reason'] = row[21];
                    data['custbody_tkio_ship_to_acc_number_purchaseorder'] = row[0];
                    resultsarray.push(data);

                }
                // log.debug({title: 'data' , details: data});
                // log.debug({title: 'parseResults' , details: resultsarray});
                return resultsarray;
            }
            catch (e) {
                log.error({ title: 'parseResults', details: e });
            }
        }
        const searchVendorsByCategory = (parameters) => {
            try {
                log.debug({
                    title: "parameters",
                    details: parameters
                });
                let rdConfig = record.load({ type: 'customrecord_tkio_wetrack_config', id: parameters, isDynamic: true });
                var categorias = rdConfig.getValue({
                    fieldId: 'custrecord_category_history'
                });
                log.debug({
                    title: "categorias",
                    details: categorias
                });
                const search_array = [];
                const vendorSearchColName = search.createColumn({ name: 'entityid', sort: search.Sort.ASC });
                const vendorSearchColAddress = search.createColumn({ name: 'address' });
                const vendorSearch = search.create({
                    type: 'vendor',
                    filters: [
                        ['category', search.Operator.ANYOF, categorias],
                    ],
                    columns: [
                        vendorSearchColName,
                        vendorSearchColAddress,
                    ],
                });
                // Note: Search.run() is limited to 4,000 results
                // vendorSearch.run().each((result: search.Result): boolean => {
                //   return true;
                // });
                const vendorSearchPagedData = vendorSearch.runPaged({ pageSize: 1000 });
                for (let i = 0; i < vendorSearchPagedData.pageRanges.length; i++) {
                    const vendorSearchPage = vendorSearchPagedData.fetch({ index: i });
                    vendorSearchPage.data.forEach((result) => {
                        const name = result.getValue(vendorSearchColName);
                        const address = result.getValue(vendorSearchColAddress);
                        search_array.push({
                            name: name,
                            address: address
                        });
                    });
                }
                return search_array;
            } catch (err) {
                log.error({
                    title: "Error occurred in searchVendorsByCategory",
                    details: err
                });
            }
        }


        return { onRequest }

    });
