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
                // search_for_tracing(SEARCH_ID, SEARCH_TYPE);
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
                if (request.method==='POST') {
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
                        //     title: "ResultObject",
                        //     details: resultObject
                        // });
                        resultObject = {};
                        return true;
                    });
                }
                log.audit({ title: "search_for_tracing RETURNING", details: resultData });
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
                body=JSON.parse(body);
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
