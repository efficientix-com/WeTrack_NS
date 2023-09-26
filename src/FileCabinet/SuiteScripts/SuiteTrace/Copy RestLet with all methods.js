/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/log', 'N/encode', 'N/file', 'N/xml', 'N/record', 'N/search', 'N/runtime'],

    (log, encode, file, xml, record, search, runtime) => {
        /**
         * Defines the function that is executed when a GET request is sent to a RESTlet.
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters passed as an Object (for all supported
         *     content types)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        // Transaction Information Variables por Packing Hierarchies
        var global_obj_items = [];
        var global_obj_items_aux = [];
        var global_obj_single_items = [];
        var global_obj = [];

        // Transaction History Variables por Packing Hierarchies
        var global_obj_items_receiving = [];
        var global_obj_items_aux_receiving = [];
        var global_obj_single_items_receiving = [];
        var global_obj_receiving = [];


        var file_id_uploaded = null;
        var id_record_transactionInformation = '';
        var epcis_is_correct = {
            record_id: '',
            success: false,
            message: ''
        }
        var CUSTOM_RECORD_ID_SUITETRACE_GRP = 'customrecord_tkio_suitetrace_grouping';
        var CUSTOM_RECORD_ID_EPCIS = 'customrecord_tkio_wetrack_xml';
        var CUSTOM_RECORD_EPCIS_TRANSACTION = 'customrecord_tkio_wetrack_epcis_transact';
        var CUSTOM_RECORD_ID = 'customrecord_wetrack_transaction';
        var CUSTOM_SHIPMENT_CONTENT_RECORD_ID = 'customrecord_tkio_wetrack_shipment_cntnt';
        const get = (requestParams) => {

        }

        /**
         * Defines the function that is executed when a PUT request is sent to a RESTlet.
         * @param {string | Object} requestBody - The HTTP request body; request body are passed as a string when request
         *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
         *     the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const put = (requestBody) => {

        }

        /**
         * Defines the function that is executed when a POST request is sent to a RESTlet.
         * @param {string | Object} requestBody - The HTTP request body; request body is passed as a string when request
         *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
         *     the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const post = (requestBody) => {
            try {
                var scriptObj = runtime.getCurrentScript();
                var folderID = scriptObj.getParameter({ name: 'custscript_tkio_wetrack_epcis_folder_id' });
                if (folderID !== '') {

                    let gln = requestBody.gln;
                    if (!gln) {
                        epcis_is_correct.success = false;
                        epcis_is_correct.message = "Missing 'gln' in JSON";
                        epcis_is_correct.record_id = '';
                    } else {
                        let decoded = encode.convert({
                            string: requestBody.file_content,
                            inputEncoding: encode.Encoding.BASE_64,
                            outputEncoding: encode.Encoding.UTF_8
                        });

                        // log.debug({
                        //     title: "Decoded content",
                        //     details: decoded
                        // });
                        let date = Date.now();
                        var fileObj = file.create({
                            name: 'EPCIS-' + gln + " - " + date + '.xml',
                            fileType: file.Type.XMLDOC,
                            contents: decoded
                        });
                        fileObj.folder = folderID;
                        file_id_uploaded = fileObj.save();
                        validateXML(decoded);
                        epcis_is_correct.record_id = make_suitetrace_grouping_registry(file_id_uploaded);


                        // log.debug({
                        //     title: "file_id_uploaded",
                        //     details: file_id_uploaded
                        // });

                        // 2. Convierte de XML a JSON para inicar recorrido de validaciones de contenido
                        var obj_xml = getXMLJSON(decoded);

                        // 3. Realiza validaciones y mapeo de datos de contenido según DSCSA
                        var transactionInformationObj = getTransactionInformationSummary(JSON.stringify(obj_xml));
                        var transactionHistoryObj = getTransactionHistoryReloaded(JSON.stringify(obj_xml));
                        var transactionStatementObj = getTransactionStatement(JSON.stringify(obj_xml));
                        var get_transaction_items = transactionInformationObj.transactionEvent;
                        var get_transaction_products_information = transactionInformationObj.products_information;



                        log.emergency({
                            title: "TRANSACTION INFORMATION OUTPUT",
                            details: transactionInformationObj.sender_info
                        });
                        log.emergency({
                            title: "TRANSACTION INFORMATION OUTPUT",
                            details: transactionInformationObj.receiver_info
                        });
                        // log.emergency({
                        //     title: "TRANSACTION INFORMATION OUTPUT SUMMARY",
                        //     details: transactionHistoryObj
                        // });
                        // Validaciones contra NS de la info del archivo
                        get_items_info(get_transaction_items, get_transaction_products_information, transactionInformationObj.senderId, transactionInformationObj.receiverId, transactionInformationObj.senderIdOfLocationOrigin, transactionInformationObj.receiverIdOfLocation, transactionInformationObj.timeTransaction, false, transactionInformationObj.receiver_info, transactionInformationObj.sender_info, transactionStatementObj);
                        transactionHistoryObj.forEach(element => {
                            log.emergency({
                                title: "TRANSACTION HISTORY OUTPUT",
                                details: element.receiver_info
                            });
                            log.emergency({
                                title: "TRANSACTION HISTORY OUTPUT",
                                details: element.sender_info
                            });
                            get_items_info(element.shipment_content, element.products_information, element.senderId, element.receiverId, element.senderIdOfLocationOrigin, element.receiverIdOfLocation, element.timeTransaction, true, element.receiver_info, element.sender_info, transactionStatementObj);
                        })

                    }

                } else {
                    epcis_is_correct.success = false;
                    epcis_is_correct.record_id = '';
                    epcis_is_correct.message = 'Folder ID not set, please contact support.'
                }

                return JSON.stringify(epcis_is_correct)

            } catch (err) {
                log.error({ title: 'Error occurred in post', details: err });
            }

        }
        function make_suitetrace_grouping_registry(id_file) {
            try {
                let obj_record = record.create({
                    type: CUSTOM_RECORD_ID_SUITETRACE_GRP,
                    isDynamic: true,
                });

                obj_record.setValue({
                    fieldId: 'custrecord_tkio_suitetrace_gr_file',
                    value: id_file
                });
                let id_record = obj_record.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                return id_record;

            } catch (err) {
                log.error({ title: 'Error occurred in make_suitetrace_grouping_registry', details: err });
            }
        }

        function get_items_info(items_hierarchy, product_information, senderId, receiverId, senderIdOfLocationOrigin, receiverIdOfLocation, timeTransaction, isTH, receiver_info, sender_info,transactionStatementObj) {
            try {
                let items = [];
                let items_levels = [];
                if (items_hierarchy) {
                    items_hierarchy.forEach(item => {
                        if (item.outermost) {
                            if (item.outermost.single_items !== []) {
                                item.outermost.single_items.forEach(single_element => {
                                    items_levels.push({
                                        item: single_element,
                                        level_1: item.outermost.id,
                                        level_2: '',
                                        level_3: '',
                                        purchase_order: item.purchase_order.split(':')[5]
                                    });
                                    items.push(single_element);
                                });
                            }
                            if (item.outermost.items_with_children !== []) {
                                item.outermost.items_with_children.forEach(item_with_child => {
                                    if (item_with_child.upper_parent) {
                                        if (item_with_child.upper_parent.single_items !== []) {
                                            item_with_child.upper_parent.single_items.forEach(single_item => {
                                                items_levels.push({
                                                    item: single_item,
                                                    level_1: item.outermost.id,
                                                    level_2: item_with_child.upper_parent.id,
                                                    level_3: '',
                                                    purchase_order: item.purchase_order.split(':')[5]
                                                });
                                                items.push(single_item);
                                            })
                                        }

                                        if (item_with_child.upper_parent.parent_item !== []) {
                                            item_with_child.upper_parent.parent_item.forEach(par_item => {
                                                if (par_item.children_items !== []) {
                                                    par_item.children_items.forEach(child_item => {
                                                        items_levels.push({
                                                            item: child_item,
                                                            level_1: item.outermost.id,
                                                            level_2: item_with_child.upper_parent.id,
                                                            level_3: par_item.id,
                                                            purchase_order: item.purchase_order.split(':')[5]
                                                        });
                                                        items.push(child_item);
                                                    })
                                                }
                                            })
                                        }
                                    }
                                    if (item_with_child.parent_item) {
                                        item_with_child.parent_item.children_items.forEach(child_item => {
                                            items_levels.push({
                                                item: child_item,
                                                level_1: item.outermost.id,
                                                level_2: item_with_child.parent_item.id,
                                                level_3: '',
                                                purchase_order: item.purchase_order.split(':')[5]
                                            });
                                            items.push(child_item);
                                        })

                                    }
                                    log.emergency({
                                        title: "items_with children get_items_info",
                                        details: item_with_child
                                    });
                                })
                            }
                        }
                    })
                }
                const filteredArray = product_information.filter(obj => items.includes(obj.sgtin));
                // get only the filteredArray data that we need
                // Because this is the one that will be on the Custom Record
                // This way, we can garantee that if the quantities are fine per NDC/item, then push this
                // information into the Custom Record
                let obj_to_custom_record = [];
                filteredArray.forEach(element => {
                    items_levels.forEach(item_w_level => {
                        if (element.sgtin === item_w_level.item) {
                            if (!isTH) {
                                obj_to_custom_record.push({
                                    is_th_from_file: false,
                                    transaction_list: item_w_level.purchase_order,
                                    lot_number: element.lotNumber,
                                    ndc: element.itemIdentification,
                                    senderId: senderId,
                                    senderIdOfLocationOrigin: senderIdOfLocationOrigin,
                                    receiverId: receiverId,
                                    receiverIdOfLocation: receiverIdOfLocation,
                                    shipment_date: timeTransaction,
                                    level_1: item_w_level.level_1,
                                    level_2: item_w_level.level_2,
                                    level_3: item_w_level.level_3,
                                    po_history: '',
                                    lot_is_suspicious: false,
                                    is_in_quarantine: false,
                                    expirationDate: element.expirationDate,
                                    productName: element.productName,
                                    nameManufacturerOrTrader: element.nameManufacturerOrTrader,
                                    dosage: element.dosage,
                                    strength: element.strength,
                                    containerSize: element.containerSize,
                                    sgtin: element.sgtin,
                                    receiver_name: receiver_info.receiver.name,
                                    receiver_addr1: receiver_info.receiver.streetAddressOne,
                                    receiver_addr2: receiver_info.receiver.streetAddressTwo,
                                    receiver_city: receiver_info.receiver.city,
                                    receiver_state: receiver_info.receiver.state,
                                    receiver_postalCode: receiver_info.receiver.postalCode,
                                    receiver_countryCode: receiver_info.receiver.countryCode,
                                    receiver_loc_name: receiver_info.receiverOfLocationOrigin.name,
                                    receiver_loc_streetAddressOne: receiver_info.receiverOfLocationOrigin.streetAddressOne,
                                    receiver_loc_streetAddressTwo: receiver_info.receiverOfLocationOrigin.streetAddressTwo,
                                    receiver_loc_city: receiver_info.receiverOfLocationOrigin.city,
                                    receiver_loc_state: receiver_info.receiverOfLocationOrigin.state,
                                    receiver_loc_postalCode: receiver_info.receiverOfLocationOrigin.postalCode,
                                    receiver_loc_countryCode: receiver_info.receiverOfLocationOrigin.countryCode,
                                    sender_name: sender_info.sender.name,
                                    sender_streetAddressOne: sender_info.sender.streetAddressOne,
                                    sender_streetAddressTwo: sender_info.sender.streetAddressTwo,
                                    sender_city: sender_info.sender.city,
                                    sender_state: sender_info.sender.state,
                                    sender_postalCode: sender_info.sender.postalCode,
                                    sender_countryCode: sender_info.sender.countryCode,
                                    sender_loc_name: sender_info.senderOfLocationOrigin.name,
                                    sender_loc_streetAddressOne: sender_info.senderOfLocationOrigin.streetAddressOne,
                                    sender_loc_streetAddressTwo: sender_info.senderOfLocationOrigin.streetAddressTwo,
                                    sender_loc_city: sender_info.senderOfLocationOrigin.city,
                                    sender_loc_postalCode: sender_info.senderOfLocationOrigin.postalCode,
                                    sender_loc_countryCode: sender_info.senderOfLocationOrigin.countryCode,
                                    epcis_document: file_id_uploaded,
                                    transaction_statement: transactionStatementObj.legalNotice




                                });
                            } else {
                                obj_to_custom_record.push({
                                    is_th_from_file: true,
                                    transaction_list: '',
                                    lot_number: element.lotNumber,
                                    ndc: element.itemIdentification,
                                    senderId: senderId,
                                    senderIdOfLocationOrigin: senderIdOfLocationOrigin,
                                    receiverId: receiverId,
                                    receiverIdOfLocation: receiverIdOfLocation,
                                    shipment_date: timeTransaction,
                                    level_1: item_w_level.level_1,
                                    level_2: item_w_level.level_2,
                                    level_3: item_w_level.level_3,
                                    po_history: item_w_level.purchase_order,
                                    lot_is_suspicious: false,
                                    is_in_quarantine: false,
                                    expirationDate: element.expirationDate,
                                    productName: element.productName,
                                    nameManufacturerOrTrader: element.nameManufacturerOrTrader,
                                    dosage: element.dosage,
                                    strength: element.strength,
                                    containerSize: element.containerSize,
                                    sgtin: element.sgtin,
                                    receiver_name: receiver_info.receiver.name,
                                    receiver_addr1: receiver_info.receiver.streetAddressOne,
                                    receiver_addr2: receiver_info.receiver.streetAddressTwo,
                                    receiver_city: receiver_info.receiver.city,
                                    receiver_state: receiver_info.receiver.state,
                                    receiver_postalCode: receiver_info.receiver.postalCode,
                                    receiver_countryCode: receiver_info.receiver.countryCode,
                                    receiver_loc_name: receiver_info.receiverOfLocationOrigin.name,
                                    receiver_loc_streetAddressOne: receiver_info.receiverOfLocationOrigin.streetAddressOne,
                                    receiver_loc_streetAddressTwo: receiver_info.receiverOfLocationOrigin.streetAddressTwo,
                                    receiver_loc_city: receiver_info.receiverOfLocationOrigin.city,
                                    receiver_loc_state: receiver_info.receiverOfLocationOrigin.state,
                                    receiver_loc_postalCode: receiver_info.receiverOfLocationOrigin.postalCode,
                                    receiver_loc_countryCode: receiver_info.receiverOfLocationOrigin.countryCode,
                                    sender_name: sender_info.sender.name,
                                    sender_streetAddressOne: sender_info.sender.streetAddressOne,
                                    sender_streetAddressTwo: sender_info.sender.streetAddressTwo,
                                    sender_city: sender_info.sender.city,
                                    sender_state: sender_info.sender.state,
                                    sender_postalCode: sender_info.sender.postalCode,
                                    sender_countryCode: sender_info.sender.countryCode,
                                    sender_loc_name: sender_info.senderOfLocationOrigin.name,
                                    sender_loc_streetAddressOne: sender_info.senderOfLocationOrigin.streetAddressOne,
                                    sender_loc_streetAddressTwo: sender_info.senderOfLocationOrigin.streetAddressTwo,
                                    sender_loc_city: sender_info.senderOfLocationOrigin.city,
                                    sender_loc_state: sender_info.senderOfLocationOrigin.state,
                                    sender_loc_postalCode: sender_info.senderOfLocationOrigin.postalCode,
                                    sender_loc_countryCode: sender_info.senderOfLocationOrigin.countryCode,
                                    epcis_document: file_id_uploaded,



                                });
                            }
                        }

                    })
                });
                const groupedData = obj_to_custom_record.reduce((result, item) => {
                    const key = `${item.ndc}-${item.lot_number}-${item.expirationDate}-${item.transaction_list}`;

                    if (!result[key]) {
                        result[key] = {
                            ndc: item.ndc,
                            lot_number: item.lot_number,
                            expirationDate: item.expirationDate,
                            purchaseOrder: item.transaction_list,
                            quantity: 1
                        };
                    } else {
                        result[key].quantity++;
                    }

                    return result;
                }, {});
                // This one will compare if the quantity per NDC matches the ones in the Purchase Order
                // Quantity must be equal or less than the desired because you have to consider partialities.

                const resultArray = Object.values(groupedData);
                if (!isTH) {

                    let correct_info_count = 0;
                    resultArray.forEach(element => {

                        let res_search = compareContentWithPurchaseOrder(element.purchaseOrder, element.lot_number, element.ndc, element.quantity, obj_to_custom_record);
                        log.emergency({
                            title: "res_search get_items_info",
                            details: res_search
                        });
                        if (res_search === true) {
                            log.emergency({
                                title: "res_search is true with this info:",
                                details: element
                            });
                            correct_info_count++;
                        } else {
                            epcis_is_correct.record_id = '';
                            epcis_is_correct.message = 'Purchase Order with items described in EPCIS were not found. Verify items in EPCIS';
                            epcis_is_correct.success = false;
                        }

                    });

                    if (correct_info_count === resultArray.length && (transactionStatementObj.affirmTransactionStatement === true || transactionStatementObj.affirmTransactionStatement === 'true') && transactionStatementObj.legalNotice !== '') {
                        // Make registry
                        obj_to_custom_record.forEach(obj => {
                            createEPCISTransaction(obj, false);
                        })
                    } else {
                        epcis_is_correct.record_id = '';
                        epcis_is_correct.message = 'Transaction statement was not found, please verify.';
                        epcis_is_correct.success = false;
                    }
                } else {

                    obj_to_custom_record.forEach(obj => {
                        createEPCISTransaction(obj, true);
                    })
                }



                // log.emergency({
                //     title: "items get_items_info",
                //     details: items
                // });
                // log.emergency({
                //     title: "items_hierarchy get_items_info",
                //     details: items_hierarchy
                // });
                // log.emergency({
                //     title: "product_information get_items_info",
                //     details: product_information
                // });
                // log.emergency({
                //     title: "filteredArray get_items_info",
                //     details: filteredArray
                // });
                log.emergency({
                    title: "resultArray get_items_info",
                    details: resultArray
                });
                log.emergency({
                    title: "obj_to_custom_record get_items_info",
                    details: obj_to_custom_record
                });

            } catch (err) {
                log.error({ title: 'Error occurred in get_items_info', details: err });
            }
        }
        function createEPCISTransaction(obj, isTH) {
            try {
                log.emergency({
                    title: "obj from createEPCISTransaction",
                    details: obj
                });
                let objRecord = record.create({
                    type: CUSTOM_RECORD_EPCIS_TRANSACTION,
                    isDynamic: false,
                });
                if (!isTH) {

                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_is_th_file',
                        value: false
                    });
                    objRecord.setText({
                        fieldId: 'custrecord_tkio_transaction_list',
                        text: 'Purchase Order #' + obj.transaction_list
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_wetrack_lot_number',
                        value: obj.lot_serial
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_lot_location',
                        value: obj.lot_location
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_wetrack_gtin',
                        value: obj.item_value
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_wetrack_sgln',
                        value: obj.senderId
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_receiver_sgln',
                        value: obj.receiverId
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_shipment_date',
                        value: obj.shipment_date
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_wetrack_level_1',
                        value: obj.level_1
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_wetrack_level_2',
                        value: obj.level_2
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_wetrack_level_3',
                        value: obj.level_3
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_po_history',
                        value: obj.po_history
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_lot_is_suspicious',
                        value: obj.lot_is_suspicious
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_is_in_quarantine',
                        value: obj.is_in_quarantine
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_sender_loc_sgln',
                        value: obj.senderIdOfLocationOrigin
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_receiver_loc_sgln',
                        value: obj.receiverIdOfLocation
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_sgtin',
                        value: obj.sgtin
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_item_name',
                        value: obj.productName
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_mt_name',
                        value: obj.nameManufacturerOrTrader
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_dosage',
                        value: obj.dosage
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_strength',
                        value: obj.strength
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_container_sz',
                        value: obj.containerSize
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_expiry_date',
                        value: obj.expirationDate
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_sender_name',
                        value: obj.sender_name
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_sender_addr1',
                        value: obj.sender_streetAddressOne
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_sender_addr2',
                        value: obj.sender_streetAddressTwo
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_sender_city',
                        value: obj.sender_city
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_sender_state',
                        value: obj.sender_state
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_sender_pc',
                        value: obj.sender_postalCode
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tko_suitetrace_sender_cc',
                        value: obj.sender_countryCode
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_rec_name',
                        value: obj.receiver_name
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_rec_addr1',
                        value: obj.receiver_addr1
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_rec_addr2',
                        value: obj.receiver_addr2
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_rec_city',
                        value: obj.receiver_city
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_rec_state',
                        value: obj.receiver_state
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_rec_cc',
                        value: obj.receiver_countryCode
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_sen_loc_name',
                        value: obj.sender_loc_name
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_sen_loc_addr1',
                        value: obj.sender_loc_streetAddressOne
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_sen_loc_addr2',
                        value: obj.sender_loc_streetAddressTwo
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_sen_loc_city',
                        value: obj.sender_loc_city
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_sen_loc_state',
                        value: obj.sender_loc_state
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_sen_loc_pc',
                        value: obj.sender_loc_postalCode
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_sen_loc_cc',
                        value: obj.sender_loc_countryCode
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_rec_loc_name',
                        value: obj.receiver_loc_name
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_rec_loc_addr1',
                        value: obj.receiver_loc_streetAddressOne
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_rec_loc_addr2',
                        value: obj.receiver_loc_streetAddressTwo
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_rec_loc_city',
                        value: obj.receiver_loc_city
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_rec_loc_state',
                        value: obj.receiver_loc_state
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_rec_loc_pc',
                        value: obj.receiver_loc_postalCode
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_rec_loc_cc',
                        value: obj.receiver_loc_countryCode
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_epcis_file',
                        value: obj.epcis_document
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_ts',
                        value: obj.transaction_statement
                    });


                    id_record_transactionInformation = objRecord.save();
                } else {
                    retrieve_compare_NDC_withTH_item(obj.ndc, obj);
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_is_th_file',
                        value: obj.is_th_from_file
                    });

                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_wetrack_lot_number',
                        value: obj.lot_number
                    });

                    objRecord.setValue({
                        fieldId: 'custrecord_wetrack_gtin',
                        value: obj.item_value
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_wetrack_sgln',
                        value: obj.senderId
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_receiver_sgln',
                        value: obj.receiverId
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_shipment_date',
                        value: obj.shipment_date
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_wetrack_level_1',
                        value: obj.level_1
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_wetrack_level_2',
                        value: obj.level_2
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_wetrack_level_3',
                        value: obj.level_3
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_po_history',
                        value: obj.po_history
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_lot_is_suspicious',
                        value: obj.lot_is_suspicious
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_is_in_quarantine',
                        value: obj.is_in_quarantine
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_sender_loc_sgln',
                        value: obj.senderIdOfLocationOrigin
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_receiver_loc_sgln',
                        value: obj.receiverIdOfLocation
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_sgtin',
                        value: obj.sgtin
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_wetrack_ti_id_related',
                        value: id_record_transactionInformation
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_item_name',
                        value: obj.productName
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_mt_name',
                        value: obj.nameManufacturerOrTrader
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_dosage',
                        value: obj.dosage
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_strength',
                        value: obj.strength
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_container_sz',
                        value: obj.containerSize
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_expiry_date',
                        value: obj.expirationDate
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_sender_name',
                        value: obj.sender_name
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_sender_addr1',
                        value: obj.sender_streetAddressOne
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_sender_addr2',
                        value: obj.sender_streetAddressTwo
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_sender_city',
                        value: obj.sender_city
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_sender_state',
                        value: obj.sender_state
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_sender_pc',
                        value: obj.sender_postalCode
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tko_suitetrace_sender_cc',
                        value: obj.sender_countryCode
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_rec_name',
                        value: obj.receiver_name
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_rec_addr1',
                        value: obj.receiver_addr1
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_rec_addr2',
                        value: obj.receiver_addr2
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_rec_city',
                        value: obj.receiver_city
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_rec_state',
                        value: obj.receiver_state
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_rec_cc',
                        value: obj.receiver_countryCode
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_sen_loc_name',
                        value: obj.sender_loc_name
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_sen_loc_addr1',
                        value: obj.sender_loc_streetAddressOne
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_sen_loc_addr2',
                        value: obj.sender_loc_streetAddressTwo
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_sen_loc_city',
                        value: obj.sender_loc_city
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_sen_loc_state',
                        value: obj.sender_loc_state
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_sen_loc_pc',
                        value: obj.sender_loc_postalCode
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_sen_loc_cc',
                        value: obj.sender_loc_countryCode
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_rec_loc_name',
                        value: obj.receiver_loc_name
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_rec_loc_addr1',
                        value: obj.receiver_loc_streetAddressOne
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_rec_loc_addr2',
                        value: obj.receiver_loc_streetAddressTwo
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_rec_loc_city',
                        value: obj.receiver_loc_city
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_rec_loc_state',
                        value: obj.receiver_loc_state
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_rec_loc_pc',
                        value: obj.receiver_loc_postalCode
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_rec_loc_cc',
                        value: obj.receiver_loc_countryCode
                    });
                    objRecord.setValue({
                        fieldId: 'custrecord_tkio_suitetrace_epcis_file',
                        value: obj.epcis_document
                    });
                    objRecord.save();


                }


            } catch (err) {
                log.error({ title: 'Error occurred in createEPCISTransaction', details: err });
            }

        }
        function retrieve_compare_NDC_withTH_item(item_ndc, obj_to_custom_record) {
            try {
                const itemSearchColName = search.createColumn({ name: 'itemid', sort: search.Sort.ASC });
                const itemSearchColDisplayName = search.createColumn({ name: 'displayname' });
                const itemSearchColInternalId = search.createColumn({ name: 'internalid' });

                const itemSearch = search.create({
                    type: 'item',
                    filters: [
                        ['name', search.Operator.IS, item_ndc],
                    ],
                    columns: [
                        itemSearchColName,
                        itemSearchColDisplayName,
                        itemSearchColInternalId,

                    ],
                });
                // Note: Search.run() is limited to 4,000 results
                // itemSearch.run().each((result: search.Result): boolean => {
                //   return true;
                // });
                const itemSearchPagedData = itemSearch.runPaged({ pageSize: 1000 });
                for (let i = 0; i < itemSearchPagedData.pageRanges.length; i++) {
                    const itemSearchPage = itemSearchPagedData.fetch({ index: i });
                    itemSearchPage.data.forEach((result) => {
                        // const name = result.getValue(itemSearchColName);
                        // const displayName = result.getValue(itemSearchColDisplayName);
                        const internalId = result.getValue(itemSearchColInternalId);
                        obj_to_custom_record.item_value = internalId;

                    });
                }

            } catch (err) {
                log.error({ title: 'Error occurred in retrueve_compare_NDCwithTH_item', details: err });
            }
        }
        function compareContentWithPurchaseOrder(po, lot, item_ndc, quantity_received, obj_to_custom_record) {
            try {
                let search_res = false;
                // log.emergency({
                //     title: "Received parameters:",
                //     details: po + ', '+lot+', '+item_ndc+', '+quantity_received
                // });
                const purchaseorderSearchColItem = search.createColumn({ name: 'item' });
                const purchaseorderSearchColQuantity = search.createColumn({ name: 'quantity' });
                const purchaseorderSearchColDocumentNumber = search.createColumn({ name: 'tranid' });
                const purchaseorderSearchColSeriallotNumber = search.createColumn({ name: 'serialnumber', join: 'item' });
                const purchaseorderSearchColSeriallotNumberLocation = search.createColumn({ name: 'serialnumberlocation', join: 'item' });
                const purchaseorderSearch = search.create({
                    type: 'purchaseorder',
                    filters: [
                        ['type', search.Operator.ANYOF, 'PurchOrd'],
                        'AND',
                        ['approvalstatus', search.Operator.ANYOF, '2'],
                        'AND',
                        ['numbertext', search.Operator.IS, po],
                        'AND',
                        ['mainline', search.Operator.IS, 'F'],
                        'AND',
                        ['item.serialnumber', search.Operator.IS, lot],
                        'AND',
                        ['status', search.Operator.ANYOF, 'PurchOrd:F', 'PurchOrd:E', 'PurchOrd:D'],
                    ],
                    columns: [
                        purchaseorderSearchColItem,
                        purchaseorderSearchColQuantity,
                        purchaseorderSearchColDocumentNumber,
                        purchaseorderSearchColSeriallotNumber,
                        purchaseorderSearchColSeriallotNumberLocation,
                    ],
                });
                // Note: Search.run() is limited to 4,000 results
                // purchaseorderSearch.run().each((result: search.Result): boolean => {
                //   return true;
                // });
                const purchaseorderSearchPagedData = purchaseorderSearch.runPaged({ pageSize: 1000 });
                for (let i = 0; i < purchaseorderSearchPagedData.pageRanges.length; i++) {
                    const purchaseorderSearchPage = purchaseorderSearchPagedData.fetch({ index: i });
                    purchaseorderSearchPage.data.forEach((result) => {
                        const item = result.getText(purchaseorderSearchColItem);
                        const item_val = result.getValue(purchaseorderSearchColItem);
                        const quantity = result.getValue(purchaseorderSearchColQuantity);
                        const documentNumber = result.getValue(purchaseorderSearchColDocumentNumber);
                        const seriallotNumber = result.getValue(purchaseorderSearchColSeriallotNumber);
                        const seriallotNumberLocation = result.getValue(purchaseorderSearchColSeriallotNumberLocation);
                        if (item === item_ndc && (quantity_received <= quantity)) {
                            obj_to_custom_record.forEach(obj => {
                                if (obj.ndc === item) {
                                    obj.item_value = item_val;
                                    obj.lot_serial = seriallotNumber;
                                    obj.lot_location = seriallotNumberLocation;

                                }
                            });
                            search_res = true;
                        }
                        // log.emergency({
                        //     title: "Actual found:",
                        //     details: item + ', '+quantity+', '+documentNumber+', '+seriallotNumber+', '+seriallotNumberLocation
                        // });
                    });
                }

                return search_res;

            } catch (err) {
                log.error({ title: 'Error occurred in compareContentWithPurchaseOrder', details: err });
            }
        }
        function validateXML(xml_body) {
            try {
                var xmlDocument = xml.Parser.fromString({
                    text: xml_body
                });
                xml.validate({
                    xml: xmlDocument,
                    xsdFilePathOrId: 'SuiteBundles/Bundle 492865/EpcisFiles/epcisSchema.xsd',
                    importFolderPathOrId: 'SuiteBundles/Bundle 492865/EpcisFiles'
                });
                epcis_is_correct.message = 'Valid XML';
                epcis_is_correct.success = true;
                return true;
            } catch (err) {
                epcis_is_correct.record_id = '';
                epcis_is_correct.message = err;
                epcis_is_correct.success = false;
                log.error({
                    title: "Error ocurred in ValidateXML",
                    details: err
                });
                return false;
            }
        }
        function make_registry(purchase_orders, file_id) {
            try {
                let objRecord = record.create({
                    type: CUSTOM_RECORD_ID_EPCIS,
                    isDynamic: false,
                });
                let currentDate = new Date();
                let str_pos = '';
                purchase_orders.forEach((po, index, arr) => {
                    if (index !== arr.length - 1) {
                        str_pos += po + ','
                    } else {
                        str_pos += po
                    }
                });
                objRecord.setValue({
                    fieldId: 'custrecord_wetrack_xml_pos',
                    value: str_pos
                });
                objRecord.setValue({
                    fieldId: 'custrecord_wetrack_xml_epcis',
                    value: file_id
                });
                objRecord.setValue({
                    fieldId: 'custrecord_wetrack_xml_date',
                    value: currentDate
                });
                objRecord.save();

            } catch (err) {
                log.error({ title: 'Error occurred in make_registry', details: err });
            }
        }
        function getXMLJSON(xmlBody) {
            var xmlObj = xml.Parser.fromString({
                text: xmlBody
            });
            var jsonObj = xmlToJson(xmlObj.documentElement);
            return jsonObj;
        }
        function xmlToJson(xmlNode) {
            // Create the return object
            var obj = Object.create(null);
            if (xmlNode.nodeType == xml.NodeType.ELEMENT_NODE) { // element
                // do attributes
                if (xmlNode.hasAttributes()) {
                    obj['_attributes'] = Object.create(null);
                    for (var j in xmlNode.attributes) {
                        if (xmlNode.hasAttribute({ name: j })) {
                            obj['_attributes'][j] = xmlNode.getAttribute({
                                name: j
                            });
                        }
                    }
                }
            } else if (xmlNode.nodeType == xml.NodeType.TEXT_NODE) { // text
                obj = xmlNode.nodeValue;
            }
            // do children
            if (xmlNode.hasChildNodes()) {
                for (var i = 0, childLen = xmlNode.childNodes.length; i < childLen; i++) {
                    var childItem = xmlNode.childNodes[i];
                    var nodeName = childItem.nodeName;
                    if (nodeName in obj) {
                        if (!Array.isArray(obj[nodeName])) {
                            obj[nodeName] = [
                                obj[nodeName]
                            ];
                        }
                        obj[nodeName].push(xmlToJson(childItem));
                    } else {
                        obj[nodeName] = xmlToJson(childItem);
                    }
                }
            }
            return obj;
        };
        function getTransactionStatement(jsonObj) {
            let res = {
                affirmTransactionStatement: '',
                legalNotice: ''
            }
            try {
                let jsonObj2 = JSON.parse(jsonObj);
                for (let j in jsonObj2.EPCISHeader) {
                    // log.audit({
                    //     title: "Where we at",
                    //     details: jsonObj2.EPCISHeader[j]
                    // });
                    if (jsonObj2.EPCISHeader[j]['gs1ushc:affirmTransactionStatement']) {
                        // log.audit({
                        //     title: "jsonObj2.EPCISHeader[j]['gs1ushc:affirmTransactionStatement']",
                        //     details: jsonObj2.EPCISHeader[j]['gs1ushc:affirmTransactionStatement']['#text']
                        // })
                        // log.audit({
                        //     title: "jsonObj2.EPCISHeader[j]['gs1ushc:legalNotice']",
                        //     details: jsonObj2.EPCISHeader[j]['gs1ushc:legalNotice']['#text']
                        // })
                        res.affirmTransactionStatement = jsonObj2.EPCISHeader[j]['gs1ushc:affirmTransactionStatement']['#text'];
                        res.legalNotice = jsonObj2.EPCISHeader[j]['gs1ushc:legalNotice']['#text'];

                        // if (jsonObj2.EPCISHeader[j]['gs1ushc:dscsaTransactionStatement']['gs1ushc:affirmTransactionStatement']) {
                        //     res.affirmTransactionStatement = jsonObj2.EPCISHeader[j]['gs1ushc:dscsaTransactionStatement']['gs1ushc:affirmTransactionStatement']['#text']
                        // }
                        // if (jsonObj2.EPCISHeader[j]['gs1ushc:dscsaTransactionStatement']['gs1ushc:legalNotice']) {
                        //     res.legalNotice = jsonObj2.EPCISHeader[j]['gs1ushc:dscsaTransactionStatement']['gs1ushc:legalNotice']['#text'];
                        // }
                        return res;
                    }
                }
            } catch (err) {
                ;
                log.error({
                    title: "Error occurred in getTransactionStatement",
                    details: err
                })
            }
        }
        function getTransactionHistoryReloaded(jsonObj) {
            try {
                res_to_return = [];
                let jsonObj2 = JSON.parse(jsonObj);
                let epcisBody = jsonObj2.EPCISBody;
                let lotNumbersAndExpirationDate = [];
                let receiverIdFinal = '';
                let receiverIdFinalLocation = '';
                let senderIdFinal = '';
                let senderIdFinalLocation = '';
                for (let j in jsonObj2.EPCISHeader) {

                    if (jsonObj2.EPCISHeader[j]["sbdh:Receiver"]) {
                        // Identificador del Receiver

                        receiverIdFinal = jsonObj2.EPCISHeader[j]["sbdh:Receiver"][
                            "sbdh:Identifier"
                        ]['#text'];

                    }
                    if (jsonObj2.EPCISHeader[j]["sbdh:Sender"]) {
                        // Identificador del Sender
                        senderIdFinal =
                            jsonObj2.EPCISHeader[j]["sbdh:Sender"][
                            "sbdh:Identifier"
                            ]['#text'];
                    }
                }
                if (epcisBody) {
                    let eventList = jsonObj2.EPCISBody.EventList;
                    if (eventList) {
                        let objectEvent = jsonObj2.EPCISBody.EventList.ObjectEvent;
                        let packing_AggregationEvent = [];
                        jsonObj2.EPCISBody.EventList.AggregationEvent.forEach(event => {
                            if (event.action['#text'] === 'ADD') {
                                packing_AggregationEvent.push(event);
                            }
                        })
                        let shippingEvent = [];
                        if (objectEvent) {
                            for (let k in objectEvent) {
                                let bizStep = objectEvent[k].bizStep['#text'];
                                let res = {
                                    senderId: '',
                                    senderIdOfLocationOrigin: '',
                                    timeTransaction: '', //this is the supplier who is receiving the products
                                    senderIdFinal: senderIdFinal,
                                    senderIdFinalLocation: '',

                                    receiverIdFinalLocation: '',
                                    receiverIdFinal: receiverIdFinal,
                                    receiverId: '',
                                    receiverIdOfLocation: '',
                                    purchaseOrders: [],
                                    invoices: [],
                                    commissioning: [],


                                }
                                if (bizStep.includes('shipping')) {
                                    if (objectEvent[k].extension.sourceList) {
                                        let sourceListSource = objectEvent[k].extension.sourceList.source;

                                        for (let m in sourceListSource) {
                                            if (sourceListSource[m]['#text']) {

                                                if (sourceListSource[m]['#text'] === res.senderIdFinal) {

                                                    if (sourceListSource.length === 2) {
                                                        senderIdFinalLocation = sourceListSource[1]['#text'];
                                                    } else {
                                                        senderIdFinalLocation = sourceListSource[0]['#text'];
                                                    }
                                                }

                                            } else {

                                                if (sourceListSource['#text'] === res.senderIdFinal) {
                                                    senderIdFinalLocation = sourceListSource['#text'];
                                                }
                                            }
                                        }
                                        res.senderIdFinalLocation = senderIdFinalLocation;

                                        for (let m in sourceListSource) {
                                            if (sourceListSource[m]['#text']) {

                                                if (sourceListSource.length === 2) {
                                                    res.senderId = sourceListSource[0]['#text'];
                                                    res.senderIdOfLocationOrigin = sourceListSource[1]['#text'];
                                                } else {
                                                    res.senderId = sourceListSource[0]['#text'];
                                                    res.senderIdOfLocationOrigin = sourceListSource[0]['#text'];
                                                }

                                            } else {
                                                res.senderId = sourceListSource['#text'];
                                                res.senderIdOfLocationOrigin = sourceListSource['#text'];
                                            }
                                        }
                                    }
                                    // Get the eventTime ==> Date of Transaction and Date of Shipment
                                    if (objectEvent[k].eventTime) {
                                        let eventTimeShipment = objectEvent[k].eventTime["#text"];
                                        res.timeTransaction = eventTimeShipment;
                                    }
                                    let auxKindexOfSender = 0;
                                    // Get the id of the receiver Location to then get the full address in commissioning
                                    if (objectEvent[k].extension.destinationList) {
                                        let destinationListSource = objectEvent[k].extension.destinationList.destination;
                                        for (let n in destinationListSource) {
                                            if (destinationListSource[n]['#text']) {
                                                if (destinationListSource[n]['#text'] === res.receiverIdFinal) {
                                                    if (destinationListSource.length === 2) {
                                                        receiverIdFinalLocation = destinationListSource[1]['#text'];
                                                    } else {
                                                        receiverIdFinalLocation = destinationListSource['#text'];
                                                    }
                                                }
                                            } else {
                                                if (destinationListSource['#text'] === res.receiverIdFinal) {
                                                    receiverIdFinalLocation = destinationListSource['#text'];
                                                }
                                            }

                                        }
                                        res.receiverIdFinalLocation = receiverIdFinalLocation;
                                        for (let n in destinationListSource) {
                                            if (destinationListSource[n]['#text']) {
                                                // log.debug({
                                                //     title: "receiverIdFinalLocation IF",
                                                //     details: res.receiverIdFinalLocation
                                                // });
                                                // log.debug({
                                                //     title: "destinationListSource[n]['#text'] IF",
                                                //     details: destinationListSource[n]['#text']
                                                // });
                                                if (destinationListSource[n]['#text'] !== res.receiverIdFinalLocation && destinationListSource[n]['#text'] !== res.receiverIdFinal) {
                                                    shippingEvent.push(objectEvent[k]);

                                                    if (destinationListSource.length === 2) {
                                                        res.receiverId = destinationListSource[0]['#text'];
                                                        res.receiverIdOfLocation = destinationListSource[1]['#text'];
                                                    } else {
                                                        res.receiverId = destinationListSource['#text'];
                                                        res.receiverIdOfLocation = destinationListSource['#text'];
                                                    }
                                                    auxKindexOfSender = k;
                                                }
                                            } else {

                                                if (destinationListSource['#text'] !== res.receiverIdFinalLocation && destinationListSource[n]['#text'] !== res.receiverIdFinal) {
                                                    shippingEvent.push(objectEvent[k]);

                                                    res.receiverIdOfLocation = destinationListSource['#text'];
                                                    auxKindexOfSender = k;
                                                }
                                            }
                                            // log.debug({
                                            //     title: "k",
                                            //     details: k
                                            // })
                                        }
                                    }

                                    // Get transactionList that has POs and possible Invoice
                                    if (objectEvent[auxKindexOfSender].bizTransactionList) {
                                        let bizTransactionList = objectEvent[auxKindexOfSender].bizTransactionList;
                                        for (let g in bizTransactionList) {
                                            for (let h in bizTransactionList[g]) {
                                                if (bizTransactionList[g][h]._attributes) {
                                                    let typebizTransactionList = bizTransactionList[g][h]._attributes.type;
                                                    if (typebizTransactionList) {
                                                        if (typebizTransactionList === "urn:epcglobal:cbv:btt:po") {

                                                            res.purchaseOrders.push(bizTransactionList[g][h]['#text']);
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    if (res.senderIdOfLocationOrigin !== res.senderIdFinalLocation) {
                                        res_to_return.push(res);
                                    }

                                }

                            }
                            for (let k in objectEvent) {
                                let bizStep = objectEvent[k].bizStep['#text'];


                                // Commissioning
                                // BizLocation must be equal to the receiverIdOfLocation
                                // In TH the receiverIdOfLocation is the distributor who got the items


                                if (bizStep.includes("commissioning")) {
                                    res_to_return.forEach(res => {

                                        if (objectEvent[k].bizLocation) {
                                            let bizLocation = objectEvent[k].bizLocation.id['#text'];
                                            log.debug({
                                                title: "bizLocation COMMISSIONING",
                                                details: bizLocation
                                            });
                                            log.debug({
                                                title: "res.receiverIdOfLocation COMMISSIONING",
                                                details: res.receiverIdOfLocation
                                            });

                                            // if (bizLocation === res.receiverIdOfLocation) {
                                            if (bizLocation === res.senderId) {
                                                log.debug({
                                                    title: "commissioning information",
                                                    details: objectEvent[k]
                                                });
                                                if (objectEvent[k].action['#text'] === "ADD") {
                                                    if (objectEvent[k].eventTime && objectEvent[k].eventTimeZoneOffset && objectEvent[k].epcList) {
                                                        if (objectEvent[k].extension) {
                                                            if (objectEvent[k].extension.ilmd["cbvmda:lotNumber"] && objectEvent[k].extension.ilmd["cbvmda:itemExpirationDate"]) {
                                                                let epcArray = objectEvent[k].epcList.epc;
                                                                if (epcArray) {
                                                                    epcArray.forEach(epc => {
                                                                        if (!res.commissioning.includes(epc['#text'])) {
                                                                            res.commissioning.push(epc['#text']);
                                                                            if (!epc['#text'].includes('sscc')) {
                                                                                lotNumbersAndExpirationDate.push({
                                                                                    sgtin: epc['#text'],
                                                                                    lotNumber: objectEvent[k].extension.ilmd["cbvmda:lotNumber"]['#text'],
                                                                                    expirationDate: objectEvent[k].extension.ilmd["cbvmda:itemExpirationDate"]['#text']
                                                                                });
                                                                            }
                                                                        }
                                                                    })
                                                                } else {
                                                                    log.error({
                                                                        title: "Commissioning event incomplete",
                                                                        details: "Make sure to have epc in epcList"
                                                                    });
                                                                }
                                                            } else {
                                                                log.error({
                                                                    title: "Commisioning event incomplete",
                                                                    details: "Make sure to have lotNumber and itemExpirationDate information"
                                                                });
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    });
                                }

                            }
                        } else {
                            log.error({
                                title: "EPCIS file error",
                                details: "ObjectEvent not found"
                            });
                        }
                        // Transaction Event
                        // Occurs when Multiple Purchase Orders are found
                        // So in this part, the outermost containers are defined per Purchase Order
                        let transactionEvent = jsonObj2.EPCISBody.EventList.TransactionEvent;
                        if (transactionEvent) {
                            log.audit({
                                title: "Anyone here?",
                                details: "Yes, there is a Transaction Event"
                            });
                            // log.debug({
                            //     title: "shippingEvent TH",
                            //     details: shippingEvent
                            // });
                            global_obj_receiving = [];
                            res_to_return.forEach((res) => {

                                for (let y in transactionEvent) {


                                    // log.audit({
                                    //     title: "transactionEvent[y] TH",
                                    //     details: transactionEvent[y]
                                    // });
                                    if (transactionEvent[y].bizTransactionList) {
                                        // log.debug({
                                        //     title: "transactionEvent[y].bizTransactionList",
                                        //     details: transactionEvent[y].bizTransactionList
                                        // });
                                        if (transactionEvent[y].bizTransactionList.bizTransaction) {
                                            // log.debug({
                                            //     title: "transactionEvent[y].bizTransactionList.bizTransaction",
                                            //     details: transactionEvent[y].bizTransactionList.bizTransaction
                                            // });
                                            let bizTransaction_type = transactionEvent[y].bizTransactionList.bizTransaction._attributes.type;
                                            if (bizTransaction_type === "urn:epcglobal:cbv:btt:po") {
                                                // log.debug({
                                                //     title: "bizTransaction_type",
                                                //     details: bizTransaction_type
                                                // });
                                                let bizTransaction_po = transactionEvent[y].bizTransactionList.bizTransaction['#text'];
                                                // log.debug({
                                                //     title: "bizTransaction_po TH",
                                                //     details: bizTransaction_po
                                                // });
                                                // log.debug({
                                                //     title: "res.purchaseOrders TH",
                                                //     details: res.purchaseOrders
                                                // });

                                                for (let x in res.purchaseOrders) {
                                                    // log.audit({
                                                    //     title: "itera segun",
                                                    //     details: res.purchaseOrders[x]
                                                    // });
                                                    if (bizTransaction_po === res.purchaseOrders[x]) {
                                                        log.debug({
                                                            title: "bizTransaction_po - res.purchaseOrders[x] TH",
                                                            details: bizTransaction_po + '-' + res.purchaseOrders[x]
                                                        });
                                                        // log.debug({
                                                        //     title: "bizTransaction_po === res.purchaseOrders[x]",
                                                        //     details: bizTransaction_po === res.purchaseOrders[x]
                                                        // });
                                                        let epcList = transactionEvent[y].epcList;
                                                        if (epcList) {
                                                            let epc = epcList.epc;
                                                            let epc_array = [];
                                                            if (epc.length) {
                                                                for (let epc_index in epc) {
                                                                    epc_array.push(epc[epc_index]['#text']);
                                                                }
                                                            } else {
                                                                epc_array.push(epc['#text']);
                                                            }

                                                            var all_parentsID = getAllParentsID(packing_AggregationEvent);
                                                            // log.debug({
                                                            //     title: "All parents ID",
                                                            //     details: all_parentsID
                                                            // });
                                                            for (let o in epc_array) {
                                                                item_isParent_receiving(epc_array[o], res.commissioning, all_parentsID, packing_AggregationEvent);
                                                                const array_only_upper_parent = global_obj_items_aux_receiving.filter(obj => obj.hasOwnProperty('upper_parent'));
                                                                const array_without_upper_parent = global_obj_items_aux_receiving.filter(obj => !obj.hasOwnProperty('upper_parent'));
                                                                // log.debug({
                                                                //     title: "array_only_upper_parent",
                                                                //     details: array_only_upper_parent
                                                                // });
                                                                // log.debug({
                                                                //     title: "array_without_upper_parent",
                                                                //     details: array_without_upper_parent
                                                                // });
                                                                const groupedArray = {};
                                                                const all_single_items = {};
                                                                const all_single_items_aux = {};
                                                                array_only_upper_parent.forEach(obj => {
                                                                    const upperParentId = obj.upper_parent.id;
                                                                    if (!groupedArray.hasOwnProperty(upperParentId)) {
                                                                        groupedArray[upperParentId] = {
                                                                            upper_parent: {
                                                                                id: upperParentId,
                                                                                single_items: [],
                                                                                parent_item: [obj.upper_parent.parent_item] // Make parent_item an array
                                                                            }
                                                                        };
                                                                    } else {
                                                                        groupedArray[upperParentId].upper_parent.parent_item.push(obj.upper_parent.parent_item); // Push the original information into the array
                                                                    }
                                                                    if (!all_single_items.hasOwnProperty(upperParentId)) {
                                                                        all_single_items[upperParentId] = {
                                                                            single_items: []
                                                                        }
                                                                    }
                                                                    if (!all_single_items_aux.hasOwnProperty(upperParentId)) {
                                                                        all_single_items_aux[upperParentId] = {
                                                                            single_items: []
                                                                        }
                                                                    }
                                                                    all_single_items[upperParentId].single_items.push(...obj.upper_parent.single_items);
                                                                    groupedArray[upperParentId].upper_parent.single_items.push(...all_single_items_aux[upperParentId].single_items);
                                                                });
                                                                const resultArray = Object.values(groupedArray);
                                                                // log.audit({
                                                                //     title: "resultArray",
                                                                //     details: resultArray
                                                                // });
                                                                // mergedArray contains the structure well-formed of the cases,bundles and items without repeating ids,etc
                                                                const mergedArray = array_without_upper_parent.concat(resultArray);
                                                                global_obj_receiving.push({
                                                                    purchase_order: res.purchaseOrders[x],
                                                                    outermost: {
                                                                        id: epc_array[o],
                                                                        single_items: global_obj_single_items_receiving,
                                                                        items_with_children: mergedArray
                                                                    }
                                                                });
                                                                // log.emergency({
                                                                //     title: "Ahhhhhh aqui anda pero ausilio",
                                                                //     details: global_obj_receiving
                                                                // });

                                                                global_obj_items_receiving = [];
                                                                global_obj_items_aux_receiving = [];
                                                                global_obj_single_items_receiving = [];
                                                            }
                                                            res.shipment_content = global_obj_receiving;


                                                        }
                                                    } else {
                                                        log.audit({
                                                            title: "Prrrfct, it means the purchase order of the shipping is only 1",
                                                            details: true
                                                        });
                                                        // There are Transaction Events BUT none of them match with a purchase order
                                                        // therefore, that current TH only has 1 purchase order
                                                        // So get the outermost container from Shipping Event
                                                        if (shippingEvent !== [] && shippingEvent) {
                                                            if (res.purchaseOrders.length === 1) {

                                                                for (let sh in shippingEvent) {
                                                                    let aux_bizTransaction = shippingEvent[sh].bizTransactionList.bizTransaction;
                                                                    aux_bizTransaction.forEach(bizTransaction => {
                                                                        let po_ofShipping = bizTransaction._attributes.type;
                                                                        if (po_ofShipping === "urn:epcglobal:cbv:btt:po") {
                                                                            global_obj_receiving = [];
                                                                            let currentPOShipping = bizTransaction['#text'];
                                                                            if (currentPOShipping === res.purchaseOrders[x]) {
                                                                                let epcList = shippingEvent[sh].epcList;
                                                                                if (epcList) {
                                                                                    let epc = epcList.epc;
                                                                                    let epc_array = [];
                                                                                    if (epc.length) {
                                                                                        for (let epc_index in epc) {
                                                                                            epc_array.push(epc[epc_index]['#text']);
                                                                                        }
                                                                                    } else {
                                                                                        epc_array.push(epc['#text']);
                                                                                    }
                                                                                    // log.emergency({
                                                                                    //     title: "SHIPPING EVENT EPCLIST",
                                                                                    //     details: epc_array
                                                                                    // });

                                                                                    var all_parentsID = getAllParentsID(packing_AggregationEvent);
                                                                                    for (let o in epc_array) {
                                                                                        item_isParent_receiving(epc_array[o], res.commissioning, all_parentsID, packing_AggregationEvent);
                                                                                        const array_only_upper_parent = global_obj_items_aux_receiving.filter(obj => obj.hasOwnProperty('upper_parent'));
                                                                                        const array_without_upper_parent = global_obj_items_aux_receiving.filter(obj => !obj.hasOwnProperty('upper_parent'));
                                                                                        // log.debug({
                                                                                        //     title: "array_only_upper_parent",
                                                                                        //     details: array_only_upper_parent
                                                                                        // });
                                                                                        // log.debug({
                                                                                        //     title: "array_without_upper_parent",
                                                                                        //     details: array_without_upper_parent
                                                                                        // });
                                                                                        const groupedArray = {};
                                                                                        const all_single_items = {};
                                                                                        const all_single_items_aux = {};
                                                                                        array_only_upper_parent.forEach(obj => {
                                                                                            const upperParentId = obj.upper_parent.id;
                                                                                            if (!groupedArray.hasOwnProperty(upperParentId)) {
                                                                                                groupedArray[upperParentId] = {
                                                                                                    upper_parent: {
                                                                                                        id: upperParentId,
                                                                                                        single_items: [],
                                                                                                        parent_item: [obj.upper_parent.parent_item] // Make parent_item an array
                                                                                                    }
                                                                                                };
                                                                                            } else {
                                                                                                groupedArray[upperParentId].upper_parent.parent_item.push(obj.upper_parent.parent_item); // Push the original information into the array
                                                                                            }
                                                                                            if (!all_single_items.hasOwnProperty(upperParentId)) {
                                                                                                all_single_items[upperParentId] = {
                                                                                                    single_items: []
                                                                                                }
                                                                                            }
                                                                                            if (!all_single_items_aux.hasOwnProperty(upperParentId)) {
                                                                                                all_single_items_aux[upperParentId] = {
                                                                                                    single_items: []
                                                                                                }
                                                                                            }
                                                                                            all_single_items[upperParentId].single_items.push(...obj.upper_parent.single_items);
                                                                                            groupedArray[upperParentId].upper_parent.single_items.push(...all_single_items_aux[upperParentId].single_items);
                                                                                        });
                                                                                        const resultArray = Object.values(groupedArray);
                                                                                        // log.audit({
                                                                                        //     title: "resultArray TH",
                                                                                        //     details: resultArray
                                                                                        // });
                                                                                        // mergedArray contains the structure well-formed of the cases,bundles and items without repeating ids,etc
                                                                                        const mergedArray = array_without_upper_parent.concat(resultArray);
                                                                                        global_obj_receiving.push({
                                                                                            purchase_order: res.purchaseOrders[x],
                                                                                            outermost: {
                                                                                                id: epc_array[o],
                                                                                                single_items: global_obj_single_items_receiving,
                                                                                                items_with_children: mergedArray
                                                                                            }
                                                                                        });
                                                                                        res.shipment_content = global_obj_receiving;
                                                                                        // log.emergency({
                                                                                        //     title: "res.shipment_content",
                                                                                        //     details: res.shipment_content
                                                                                        // });
                                                                                        global_obj_items_receiving = [];
                                                                                        global_obj_items_aux_receiving = [];
                                                                                        global_obj_single_items_receiving = [];
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                        // res.shipment_content = global_obj_receiving;
                                                                    })



                                                                }

                                                            }
                                                        }
                                                    }
                                                }
                                            } else {
                                                log.audit({
                                                    title: "The purchase order does not match in the Transaction Event",
                                                    details: true
                                                });
                                            }
                                        }
                                    }
                                }

                            });

                        } else {
                            log.audit({
                                title: "Anyone here?",
                                details: "Kinda, but only shipping"
                            });
                            global_obj_receiving = [];
                            res_to_return.forEach((res) => {
                                if (shippingEvent !== [] && shippingEvent) {
                                    if (res.purchaseOrders.length === 1) {
                                        for (let x in res.purchaseOrders) {
                                            for (let sh in shippingEvent) {
                                                let aux_bizTransaction = shippingEvent[sh].bizTransactionList.bizTransaction;
                                                aux_bizTransaction.forEach(bizTransaction => {
                                                    let po_ofShipping = bizTransaction._attributes.type;
                                                    if (po_ofShipping === "urn:epcglobal:cbv:btt:po") {
                                                        global_obj_receiving = [];
                                                        let currentPOShipping = bizTransaction['#text'];
                                                        if (currentPOShipping === res.purchaseOrders[x]) {
                                                            let epcList = shippingEvent[sh].epcList;
                                                            if (epcList) {
                                                                let epc = epcList.epc;
                                                                let epc_array = [];
                                                                if (epc.length) {
                                                                    for (let epc_index in epc) {
                                                                        epc_array.push(epc[epc_index]['#text']);
                                                                    }
                                                                } else {
                                                                    epc_array.push(epc['#text']);
                                                                }
                                                                // log.emergency({
                                                                //     title: "SHIPPING EVENT EPCLIST",
                                                                //     details: epc_array
                                                                // });
                                                                var all_parentsID = getAllParentsID(packing_AggregationEvent);
                                                                for (let o in epc_array) {
                                                                    item_isParent_receiving(epc_array[o], res.commissioning, all_parentsID, packing_AggregationEvent);
                                                                    const array_only_upper_parent = global_obj_items_aux_receiving.filter(obj => obj.hasOwnProperty('upper_parent'));
                                                                    const array_without_upper_parent = global_obj_items_aux_receiving.filter(obj => !obj.hasOwnProperty('upper_parent'));
                                                                    // log.debug({
                                                                    //     title: "array_only_upper_parent",
                                                                    //     details: array_only_upper_parent
                                                                    // });
                                                                    // log.debug({
                                                                    //     title: "array_without_upper_parent",
                                                                    //     details: array_without_upper_parent
                                                                    // });
                                                                    const groupedArray = {};
                                                                    const all_single_items = {};
                                                                    const all_single_items_aux = {};
                                                                    array_only_upper_parent.forEach(obj => {
                                                                        const upperParentId = obj.upper_parent.id;
                                                                        if (!groupedArray.hasOwnProperty(upperParentId)) {
                                                                            groupedArray[upperParentId] = {
                                                                                upper_parent: {
                                                                                    id: upperParentId,
                                                                                    single_items: [],
                                                                                    parent_item: [obj.upper_parent.parent_item] // Make parent_item an array
                                                                                }
                                                                            };
                                                                        } else {
                                                                            groupedArray[upperParentId].upper_parent.parent_item.push(obj.upper_parent.parent_item); // Push the original information into the array
                                                                        }
                                                                        if (!all_single_items.hasOwnProperty(upperParentId)) {
                                                                            all_single_items[upperParentId] = {
                                                                                single_items: []
                                                                            }
                                                                        }
                                                                        if (!all_single_items_aux.hasOwnProperty(upperParentId)) {
                                                                            all_single_items_aux[upperParentId] = {
                                                                                single_items: []
                                                                            }
                                                                        }
                                                                        all_single_items[upperParentId].single_items.push(...obj.upper_parent.single_items);
                                                                        groupedArray[upperParentId].upper_parent.single_items.push(...all_single_items_aux[upperParentId].single_items);
                                                                    });
                                                                    const resultArray = Object.values(groupedArray);
                                                                    // log.audit({
                                                                    //     title: "resultArray TH",
                                                                    //     details: resultArray
                                                                    // });
                                                                    // mergedArray contains the structure well-formed of the cases,bundles and items without repeating ids,etc
                                                                    const mergedArray = array_without_upper_parent.concat(resultArray);
                                                                    global_obj_receiving.push({
                                                                        purchase_order: res.purchaseOrders[x],
                                                                        outermost: {
                                                                            id: epc_array[o],
                                                                            single_items: global_obj_single_items_receiving,
                                                                            items_with_children: mergedArray
                                                                        }
                                                                    });
                                                                    res.shipment_content = global_obj_receiving;
                                                                    // log.emergency({
                                                                    //     title: "res.shipment_content SH ONLY",
                                                                    //     details: res.shipment_content
                                                                    // });
                                                                    global_obj_items_receiving = [];
                                                                    global_obj_items_aux_receiving = [];
                                                                    global_obj_single_items_receiving = [];
                                                                }
                                                            }
                                                        }
                                                    }
                                                    // res.shipment_content = global_obj_receiving;
                                                })



                                            }
                                        }


                                    }
                                }
                            });


                        }
                    }
                } else {
                    log.error({
                        title: "EPCIS file error",
                        details: "EPCISBody not found"
                    })
                }
                // Begins Master Data Analysis
                let aux_arrayProducts = [];
                let aux_addresses = [];
                let aux_sender_info = {};
                let aux_receiver_info = {};
                let epcisMasterData = jsonObj2.EPCISHeader.extension['EPCISMasterData'];
                if (epcisMasterData) {
                    let vocabularyList = epcisMasterData['VocabularyList'];
                    let vocabularyList_array = [];
                    if (vocabularyList.length) {
                        for (let x in vocabularyList) {
                            vocabularyList_array.push(vocabularyList[x]);
                        }
                    } else {
                        vocabularyList_array.push(vocabularyList);
                    }
                    for (let j in vocabularyList_array) {
                        // log.debug({
                        //     title: "vocabularyList_array[j]",
                        //     details: vocabularyList_array[j]
                        // });
                        for (let k in vocabularyList_array[j]) {
                            // log.debug({
                            //     title: "vocabularyList_array[j][k]",
                            //     details: vocabularyList_array[j][k]
                            // })
                            if (vocabularyList_array[j][k] !== '') {
                                for (let x in vocabularyList_array[j][k]) {
                                    let attributes = vocabularyList_array[j][k][x]._attributes;
                                    // log.debug({
                                    //     title: "attributes",
                                    //     details: vocabularyList_array[j][k][x]._attributes
                                    // });
                                    if (attributes) {
                                        res_to_return.forEach(res => {
                                            // EPCClass if for information of the products described in transaction
                                            if (attributes['type'] === "urn:epcglobal:epcis:vtype:EPCClass") {
                                                // log.debug({
                                                //     title: "attributes['type'] === 'urn:epcglobal:epcis:vtype:EPCClass'",
                                                //     details: attributes['type'] === "urn:epcglobal:epcis:vtype:EPCClass"
                                                // })
                                                let vocabularyElement = vocabularyList_array[j][k][x].VocabularyElementList.VocabularyElement;
                                                let arrayProducts = [];
                                                for (let m in vocabularyElement) {
                                                    // log.emergency({
                                                    //     title: "vocabularyElement[m] EPCClass",
                                                    //     details: vocabularyElement[m]
                                                    // });
                                                    if (vocabularyElement[m]._attributes) {
                                                        let idVocabularyElement = vocabularyElement[m]._attributes.id;
                                                        if (res.commissioning.length > 0) {
                                                            res.commissioning.forEach(singleSGTIN => {
                                                                // log.debug({
                                                                //     title: "Entered for iteration of sgtin",
                                                                //     details: true
                                                                // });
                                                                const searchStr = "sgtin:";
                                                                const startIndexSGTINres = singleSGTIN.indexOf(searchStr) + searchStr.length;
                                                                const startIndexIdVocabulary = idVocabularyElement.indexOf(searchStr) + searchStr.length;
                                                                const singleSGTINfromres = singleSGTIN.substring(startIndexSGTINres);
                                                                const singleSGTINfromres_pt = singleSGTINfromres.split(".")[0] + singleSGTINfromres.split(".")[1];
                                                                const singleidVocabularyElement = idVocabularyElement.substring(startIndexIdVocabulary);
                                                                const singleidVocabularyElement_pt = singleidVocabularyElement.split(".")[0] + singleidVocabularyElement.split(".")[1];
                                                                if (singleidVocabularyElement_pt === singleSGTINfromres_pt) {
                                                                    let productInfo = {
                                                                        sgtin: '',
                                                                        itemIdentification: '',
                                                                        itemIdentificationTypeCode: '',
                                                                        productName: '',
                                                                        nameManufacturerOrTrader: '',
                                                                        dosage: '',
                                                                        strength: '',
                                                                        containerSize: '',
                                                                        lotNumber: '',
                                                                        expirationDate: ''
                                                                    };
                                                                    for (let n in vocabularyElement[m].attribute) {
                                                                        // log.debug({
                                                                        //     title: "Entered for iteration of attribute of vocabularyElement",
                                                                        //     details: true
                                                                        // });
                                                                        let idVocabularyElement_single = vocabularyElement[m].attribute[n]._attributes.id;
                                                                        switch (idVocabularyElement_single) {
                                                                            case 'urn:epcglobal:cbv:mda#additionalTradeItemIdentification':
                                                                                productInfo.itemIdentification = vocabularyElement[m].attribute[n]["#text"];
                                                                                break;
                                                                            case 'urn:epcglobal:cbv:mda#additionalTradeItemIdentificationTypeCode':
                                                                                productInfo.itemIdentificationTypeCode = vocabularyElement[m].attribute[n]["#text"];
                                                                                break;
                                                                            case 'urn:epcglobal:cbv:mda#regulatedProductName':
                                                                                productInfo.productName = vocabularyElement[m].attribute[n]["#text"];
                                                                                break;
                                                                            case 'urn:epcglobal:cbv:mda#manufacturerOfTradeItemPartyName':
                                                                                productInfo.nameManufacturerOrTrader = vocabularyElement[m].attribute[n]["#text"];
                                                                                break;
                                                                            case 'urn:epcglobal:cbv:mda#dosageFormType':
                                                                                productInfo.dosage = vocabularyElement[m].attribute[n]["#text"];
                                                                                break;
                                                                            case 'urn:epcglobal:cbv:mda#strengthDescription':
                                                                                productInfo.strength = vocabularyElement[m].attribute[n]["#text"];
                                                                                break;
                                                                            case 'urn:epcglobal:cbv:mda#netContentDescription':
                                                                                productInfo.containerSize = vocabularyElement[m].attribute[n]["#text"];
                                                                                break;
                                                                            default: log.error({
                                                                                title: "EPCIS Master Data error",
                                                                                details: "id in VocabularyElement in EPCClass is not allowed: " + idVocabularyElement_single
                                                                            });
                                                                                break;
                                                                        }
                                                                    }
                                                                    productInfo.sgtin = singleSGTIN
                                                                    let obj_expiry_lotnumber = setExpiryAndLotNumber(singleSGTIN, lotNumbersAndExpirationDate);
                                                                    if (obj_expiry_lotnumber !== {}) {
                                                                        productInfo.lotNumber = obj_expiry_lotnumber.lotNumber;
                                                                        productInfo.expirationDate = obj_expiry_lotnumber.expirationDate;
                                                                    } else {
                                                                        log.error({
                                                                            title: "EPCIS file error",
                                                                            details: "There are no lot numbers or expiration date on items in commissioning"
                                                                        });
                                                                    }
                                                                    arrayProducts.push(productInfo);
                                                                }
                                                            });
                                                        }
                                                    }
                                                    // } else {
                                                    //     log.error({
                                                    //         title: "EPCIS Master Data error",
                                                    //         details: "VocabularyElement must contain an id"
                                                    //     });
                                                    // }
                                                }
                                                aux_arrayProducts = arrayProducts;
                                            }
                                            if (attributes['type'] === "urn:epcglobal:epcis:vtype:Location") {
                                                let vocabularyElement = vocabularyList_array[j][k][x].VocabularyElementList.VocabularyElement;
                                                let arrayAddresses = [];
                                                for (let m in vocabularyElement) {
                                                    let idVocabularyElement = vocabularyElement[m]._attributes.id;
                                                    if (res.senderIdOfLocationOrigin) {
                                                        const searchStr = "sgln:";
                                                        const startIndexSGLNres = res.senderIdOfLocationOrigin.indexOf(searchStr) + searchStr.length;
                                                        const startIndexIdVocabulary = idVocabularyElement.indexOf(searchStr) + searchStr.length;
                                                        const singleSGLNfromres = res.senderIdOfLocationOrigin.substring(startIndexSGLNres);
                                                        const singleSGLNfromres_pt = singleSGLNfromres.split(".")[0] + singleSGLNfromres.split(".")[1];
                                                        const singleidVocabularyElement = idVocabularyElement.substring(startIndexIdVocabulary);
                                                        const singleidVocabularyElement_pt = singleidVocabularyElement.split(".")[0] + singleidVocabularyElement.split(".")[1];
                                                        if (singleidVocabularyElement_pt === singleSGLNfromres_pt) {
                                                            let address_info = {
                                                                sgln: '',
                                                                name: '',
                                                                streetAddressOne: '',
                                                                streetAddressTwo: '',
                                                                city: '',
                                                                state: '',
                                                                postalCode: '',
                                                                countryCode: ''
                                                            }
                                                            for (let n in vocabularyElement[m].attribute) {
                                                                let idVocabularyElement_single = vocabularyElement[m].attribute[n]._attributes.id;
                                                                switch (idVocabularyElement_single) {
                                                                    case 'urn:epcglobal:cbv:mda#name':
                                                                        address_info.name = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    case 'urn:epcglobal:cbv:mda#streetAddressOne':
                                                                        address_info.streetAddressOne = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    case 'urn:epcglobal:cbv:mda#streetAddressTwo':
                                                                        address_info.streetAddressTwo = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    case 'urn:epcglobal:cbv:mda#city':
                                                                        address_info.city = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    case 'urn:epcglobal:cbv:mda#name':
                                                                        address_info.name = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    case 'urn:epcglobal:cbv:mda#state':
                                                                        address_info.state = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    case 'urn:epcglobal:cbv:mda#postalCode':
                                                                        address_info.postalCode = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    case 'urn:epcglobal:cbv:mda#countryCode':
                                                                        address_info.countryCode = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    default: log.error({
                                                                        title: "EPCIS Master Data error",
                                                                        details: "id in Vocabulary Element in Location is not allowed: " + idVocabularyElement_single
                                                                    });
                                                                        break;

                                                                }
                                                            }
                                                            address_info.sgln = res.senderIdOfLocationOrigin;
                                                            arrayAddresses.push(address_info);
                                                        }
                                                    }
                                                    if (res.receiverIdOfLocation) {
                                                        const searchStr = "sgln:";
                                                        const startIndexSGLNres = res.receiverIdOfLocation.indexOf(searchStr) + searchStr.length;
                                                        const startIndexIdVocabulary = idVocabularyElement.indexOf(searchStr) + searchStr.length;
                                                        const singleSGLNfromres = res.receiverIdOfLocation.substring(startIndexSGLNres);
                                                        const singleSGLNfromres_pt = singleSGLNfromres.split(".")[0] + singleSGLNfromres.split(".")[1];
                                                        const singleidVocabularyElement = idVocabularyElement.substring(startIndexIdVocabulary);
                                                        const singleidVocabularyElement_pt = singleidVocabularyElement.split(".")[0] + singleidVocabularyElement.split(".")[1];
                                                        if (singleidVocabularyElement_pt === singleSGLNfromres_pt) {
                                                            let address_info = {
                                                                sgln: '',
                                                                name: '',
                                                                streetAddressOne: '',
                                                                streetAddressTwo: '',
                                                                city: '',
                                                                state: '',
                                                                postalCode: '',
                                                                countryCode: ''
                                                            }
                                                            for (let n in vocabularyElement[m].attribute) {
                                                                let idVocabularyElement_single = vocabularyElement[m].attribute[n]._attributes.id;
                                                                switch (idVocabularyElement_single) {
                                                                    case 'urn:epcglobal:cbv:mda#name':
                                                                        address_info.name = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    case 'urn:epcglobal:cbv:mda#streetAddressOne':
                                                                        address_info.streetAddressOne = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    case 'urn:epcglobal:cbv:mda#streetAddressTwo':
                                                                        address_info.streetAddressTwo = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    case 'urn:epcglobal:cbv:mda#city':
                                                                        address_info.city = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    case 'urn:epcglobal:cbv:mda#name':
                                                                        address_info.name = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    case 'urn:epcglobal:cbv:mda#state':
                                                                        address_info.state = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    case 'urn:epcglobal:cbv:mda#postalCode':
                                                                        address_info.postalCode = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    case 'urn:epcglobal:cbv:mda#countryCode':
                                                                        address_info.countryCode = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    default: log.error({
                                                                        title: "EPCIS Master Data error",
                                                                        details: "id in Vocabulary Element in Location is not allowed: " + idVocabularyElement_single
                                                                    });
                                                                        break;

                                                                }
                                                            }
                                                            address_info.sgln = res.receiverIdOfLocation;
                                                            arrayAddresses.push(address_info);
                                                        }
                                                    }
                                                    if (res.senderId) {
                                                        const searchStr = "sgln:";
                                                        const startIndexSGLNres = res.senderId.indexOf(searchStr) + searchStr.length;
                                                        const startIndexIdVocabulary = idVocabularyElement.indexOf(searchStr) + searchStr.length;
                                                        const singleSGLNfromres = res.senderId.substring(startIndexSGLNres);
                                                        const singleSGLNfromres_pt = singleSGLNfromres.split(".")[0] + singleSGLNfromres.split(".")[1];
                                                        const singleidVocabularyElement = idVocabularyElement.substring(startIndexIdVocabulary);
                                                        const singleidVocabularyElement_pt = singleidVocabularyElement.split(".")[0] + singleidVocabularyElement.split(".")[1];
                                                        if (singleidVocabularyElement_pt === singleSGLNfromres_pt) {
                                                            let address_info = {
                                                                sgln: '',
                                                                name: '',
                                                                streetAddressOne: '',
                                                                streetAddressTwo: '',
                                                                city: '',
                                                                state: '',
                                                                postalCode: '',
                                                                countryCode: ''
                                                            }
                                                            for (let n in vocabularyElement[m].attribute) {
                                                                let idVocabularyElement_single = vocabularyElement[m].attribute[n]._attributes.id;
                                                                switch (idVocabularyElement_single) {
                                                                    case 'urn:epcglobal:cbv:mda#name':
                                                                        address_info.name = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    case 'urn:epcglobal:cbv:mda#streetAddressOne':
                                                                        address_info.streetAddressOne = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    case 'urn:epcglobal:cbv:mda#streetAddressTwo':
                                                                        address_info.streetAddressTwo = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    case 'urn:epcglobal:cbv:mda#city':
                                                                        address_info.city = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    case 'urn:epcglobal:cbv:mda#name':
                                                                        address_info.name = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    case 'urn:epcglobal:cbv:mda#state':
                                                                        address_info.state = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    case 'urn:epcglobal:cbv:mda#postalCode':
                                                                        address_info.postalCode = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    case 'urn:epcglobal:cbv:mda#countryCode':
                                                                        address_info.countryCode = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    default: log.error({
                                                                        title: "EPCIS Master Data error",
                                                                        details: "id in Vocabulary Element in Location is not allowed: " + idVocabularyElement_single
                                                                    });
                                                                        break;

                                                                }
                                                            }
                                                            address_info.sgln = res.senderId;
                                                            arrayAddresses.push(address_info);
                                                        }
                                                    }
                                                    if (res.receiverId) {
                                                        const searchStr = "sgln:";
                                                        const startIndexSGLNres = res.receiverId.indexOf(searchStr) + searchStr.length;
                                                        const startIndexIdVocabulary = idVocabularyElement.indexOf(searchStr) + searchStr.length;
                                                        const singleSGLNfromres = res.receiverId.substring(startIndexSGLNres);
                                                        const singleSGLNfromres_pt = singleSGLNfromres.split(".")[0] + singleSGLNfromres.split(".")[1];
                                                        const singleidVocabularyElement = idVocabularyElement.substring(startIndexIdVocabulary);
                                                        const singleidVocabularyElement_pt = singleidVocabularyElement.split(".")[0] + singleidVocabularyElement.split(".")[1];
                                                        if (singleidVocabularyElement_pt === singleSGLNfromres_pt) {
                                                            let address_info = {
                                                                sgln: '',
                                                                name: '',
                                                                streetAddressOne: '',
                                                                streetAddressTwo: '',
                                                                city: '',
                                                                state: '',
                                                                postalCode: '',
                                                                countryCode: ''
                                                            }
                                                            for (let n in vocabularyElement[m].attribute) {
                                                                let idVocabularyElement_single = vocabularyElement[m].attribute[n]._attributes.id;
                                                                switch (idVocabularyElement_single) {
                                                                    case 'urn:epcglobal:cbv:mda#name':
                                                                        address_info.name = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    case 'urn:epcglobal:cbv:mda#streetAddressOne':
                                                                        address_info.streetAddressOne = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    case 'urn:epcglobal:cbv:mda#streetAddressTwo':
                                                                        address_info.streetAddressTwo = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    case 'urn:epcglobal:cbv:mda#city':
                                                                        address_info.city = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    case 'urn:epcglobal:cbv:mda#name':
                                                                        address_info.name = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    case 'urn:epcglobal:cbv:mda#state':
                                                                        address_info.state = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    case 'urn:epcglobal:cbv:mda#postalCode':
                                                                        address_info.postalCode = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    case 'urn:epcglobal:cbv:mda#countryCode':
                                                                        address_info.countryCode = vocabularyElement[m].attribute[n]["#text"];
                                                                        break;
                                                                    default: log.error({
                                                                        title: "EPCIS Master Data error",
                                                                        details: "id in Vocabulary Element in Location is not allowed: " + idVocabularyElement_single
                                                                    });
                                                                        break;

                                                                }
                                                            }
                                                            address_info.sgln = res.receiverId;
                                                            arrayAddresses.push(address_info);
                                                        }
                                                    }
                                                }
                                                // log.debug({
                                                //     title: "arrayAddresses",
                                                //     details: arrayAddresses
                                                // });
                                                aux_addresses = arrayAddresses;
                                                // Aquí inicia lo de poner estructura a lo de la info de SENDER y RECEIVER. Es poner el id y sus direcciones
                                                // log.debug({
                                                //     title: "RES SENDER",
                                                //     details: res.senderId
                                                // });
                                                // for the SENDER INFO
                                                aux_sender_info = {
                                                    sender: {

                                                    },
                                                    senderOfLocationOrigin: {

                                                    }
                                                }
                                                aux_receiver_info = {
                                                    receiver: {

                                                    },
                                                    receiverOfLocationOrigin: {

                                                    }
                                                }
                                                aux_addresses.forEach(address => {
                                                    if (address.sgln === res.senderId) {
                                                        aux_sender_info.sender.senderId = address.sgln;
                                                        aux_sender_info.sender.name = address.name;
                                                        aux_sender_info.sender.streetAddressOne = address.streetAddressOne;
                                                        aux_sender_info.sender.streetAddressTwo = address.streetAddressTwo;
                                                        aux_sender_info.sender.city = address.city;
                                                        aux_sender_info.sender.state = address.state;
                                                        aux_sender_info.sender.postalCode = address.postalCode;
                                                        aux_sender_info.sender.countryCode = address.countryCode;
                                                    }
                                                    if (address.sgln === res.senderIdOfLocationOrigin) {
                                                        aux_sender_info.senderOfLocationOrigin.senderId = address.sgln;
                                                        aux_sender_info.senderOfLocationOrigin.name = address.name;
                                                        aux_sender_info.senderOfLocationOrigin.streetAddressOne = address.streetAddressOne;
                                                        aux_sender_info.senderOfLocationOrigin.streetAddressTwo = address.streetAddressTwo;
                                                        aux_sender_info.senderOfLocationOrigin.city = address.city;
                                                        aux_sender_info.senderOfLocationOrigin.state = address.state;
                                                        aux_sender_info.senderOfLocationOrigin.postalCode = address.postalCode;
                                                        aux_sender_info.senderOfLocationOrigin.countryCode = address.countryCode;

                                                    }
                                                    if (address.sgln === res.receiverId) {
                                                        aux_receiver_info.receiver.receiverId = address.sgln;
                                                        aux_receiver_info.receiver.name = address.name;
                                                        aux_receiver_info.receiver.streetAddressOne = address.streetAddressOne;
                                                        aux_receiver_info.receiver.streetAddressTwo = address.streetAddressTwo;
                                                        aux_receiver_info.receiver.city = address.city;
                                                        aux_receiver_info.receiver.state = address.state;
                                                        aux_receiver_info.receiver.postalCode = address.postalCode;
                                                        aux_receiver_info.receiver.countryCode = address.countryCode;
                                                    }
                                                    if (address.sgln === res.receiverIdOfLocation) {
                                                        aux_receiver_info.receiverOfLocationOrigin.receiverId = address.sgln;
                                                        aux_receiver_info.receiverOfLocationOrigin.name = address.name;
                                                        aux_receiver_info.receiverOfLocationOrigin.streetAddressOne = address.streetAddressOne;
                                                        aux_receiver_info.receiverOfLocationOrigin.streetAddressTwo = address.streetAddressTwo;
                                                        aux_receiver_info.receiverOfLocationOrigin.city = address.city;
                                                        aux_receiver_info.receiverOfLocationOrigin.state = address.state;
                                                        aux_receiver_info.receiverOfLocationOrigin.postalCode = address.postalCode;
                                                        aux_receiver_info.receiverOfLocationOrigin.countryCode = address.countryCode;
                                                    }
                                                });

                                            }
                                            res.products_information = aux_arrayProducts;
                                            res.addresses = aux_addresses;
                                            res.sender_info = aux_sender_info;
                                            res.receiver_info = aux_receiver_info;
                                        });

                                    }
                                }
                            }
                        }
                    }
                }
                else {
                    log.error({
                        title: "EPCIS file error",
                        details: "EPCISMasterData not found"
                    });
                }
                // log.audit({
                //     title: "res_to_return",
                //     details: res_to_return
                // });
                return res_to_return;

            } catch (err) {
                log.error({ title: 'Error occurred in getTransactionHistoryReloaded', details: err });
            }
        }
        function getTransactionInformationSummary(jsonObj) {
            try {
                // log.debug({
                //     title: "type of jsonObj",
                //     details: typeof jsonObj
                // })
                let jsonObj2 = JSON.parse(jsonObj);
                // log.debug({
                //     title: "sonObj2",
                //     details: jsonObj2
                // })
                // log.debug({
                //     title: "DATA",
                //     details: jsonObj2.EPCISBody
                // })
                let res = {
                    senderId: "",
                    receiverId: "",
                    senderIdOfLocationOrigin: "",
                    receiverIdOfLocation: "",
                    timeTransaction: "",
                    commissioning: [],
                    purchaseOrders: [],
                    transactionEvent: [],
                    products_information: [],
                    addresses: [],
                    sender_info: {},
                    receiver_info: {}
                };
                let lotNumbersAndExpirationDate = [];
                for (let j in jsonObj2.EPCISHeader) {
                    if (jsonObj2.EPCISHeader[j]["sbdh:Sender"]) {
                        // Identificador del Sender
                        res.senderId =
                            jsonObj2.EPCISHeader[j]["sbdh:Sender"][
                            "sbdh:Identifier"
                            ]['#text'];
                        // console.log(jsonObj2.EPCISHeader[j]['sbdh:Sender']['sbdh:Identifier']['#text']);
                    }
                    if (jsonObj2.EPCISHeader[j]["sbdh:Receiver"]) {
                        // Identificador del Receiver
                        res.receiverId =
                            jsonObj2.EPCISHeader[j]["sbdh:Receiver"][
                            "sbdh:Identifier"
                            ]['#text'];
                        // console.log(jsonObj2.EPCISHeader[j]['sbdh:Sender']['sbdh:Identifier']['#text']);
                    }
                }
                // Inicia análisis de shipping y commisioning
                // Considera que los ObjectEvents pueden estar regados, por ejemplo Shipping estuviera antes de Commissioning 
                // y asi no se podría hacer bien el commissioning por no tener un ID de location de parte de Shipping
                let epcisBody = jsonObj2.EPCISBody;
                let shippingEvent = [];
                if (epcisBody) {
                    let eventList = jsonObj2.EPCISBody.EventList;
                    if (eventList) {
                        let objectEvent = jsonObj2.EPCISBody.EventList.ObjectEvent;
                        let packing_AggregationEvent = [];
                        jsonObj2.EPCISBody.EventList.AggregationEvent.forEach(event => {
                            if (event.action['#text'] === 'ADD') {
                                packing_AggregationEvent.push(event);
                            }
                        })
                        if (objectEvent) {
                            for (let k in objectEvent) {
                                let bizStep = objectEvent[k].bizStep['#text'];
                                if (bizStep.includes("shipping")) {
                                    // log.debug({
                                    //     title: "bizStep",
                                    //     details: objectEvent[k]
                                    // });
                                    // falta primero validar que el senderId se encuentre en alguno de la lista del sourceList
                                    if (objectEvent[k].extension.sourceList) {
                                        let sourceListSource = objectEvent[k].extension.sourceList.source;
                                        for (let m in sourceListSource) {
                                            // Esto es en caso de que exista sourceList Location entonces toma ese Location
                                            if (sourceListSource[m]['#text']) {
                                                if (sourceListSource[m]['#text'] === res.senderId) {
                                                    shippingEvent.push(objectEvent[k]);
                                                    if (sourceListSource.length === 2) {
                                                        // console.log("Aquí está:", sourceListSource[1]);
                                                        res.senderIdOfLocationOrigin = sourceListSource[1]['#text'];
                                                    } else {
                                                        res.senderIdOfLocationOrigin = sourceListSource[0]['#text'];
                                                    }
                                                }
                                            } else {
                                                // Si no se tiene un Location, se debe comparar que el source text sea el del id del sender
                                                if (sourceListSource['#text'] === res.senderId) {
                                                    shippingEvent.push(objectEvent[k]);
                                                    res.senderIdOfLocationOrigin = sourceListSource['#text'];
                                                }
                                            }
                                        }
                                    }
                                    // Get the eventTime ==> Date of Transaction and Date of Shipment
                                    if (objectEvent[k].eventTime) {
                                        let eventTimeShipment = objectEvent[k].eventTime["#text"];
                                        res.timeTransaction = eventTimeShipment;
                                    }
                                    let auxKindexOfSender = 0;
                                    // Get the id of the receiver Location to then get the full address in commissioning
                                    if (objectEvent[k].extension.destinationList) {
                                        let destinationListSource = objectEvent[k].extension.destinationList.destination;
                                        for (let n in destinationListSource) {
                                            if (destinationListSource[n]['#text']) {
                                                if (destinationListSource[n]['#text'] === res.receiverId) {
                                                    if (destinationListSource.length === 2) {
                                                        res.receiverIdOfLocation = destinationListSource[1]['#text'];
                                                    } else {
                                                        res.receiverIdOfLocation = destinationListSource['#text'];
                                                    }
                                                    auxKindexOfSender = k;
                                                }
                                            } else {
                                                if (destinationListSource['#text'] === res.receiverId) {
                                                    res.receiverIdOfLocation = destinationListSource['#text'];
                                                    auxKindexOfSender = k;
                                                }
                                            }
                                        }
                                    }
                                    // Get transactionList that has POs and possible Invoice
                                    if (objectEvent[auxKindexOfSender].bizTransactionList) {
                                        let bizTransactionList = objectEvent[auxKindexOfSender].bizTransactionList;
                                        for (let g in bizTransactionList) {
                                            for (let h in bizTransactionList[g]) {
                                                if (bizTransactionList[g][h]._attributes) {
                                                    let typebizTransactionList = bizTransactionList[g][h]._attributes.type;
                                                    if (typebizTransactionList) {
                                                        if (typebizTransactionList === "urn:epcglobal:cbv:btt:po") {
                                                            res.purchaseOrders.push(bizTransactionList[g][h]['#text']);
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            // get the commissioning information
                            // Check that the senderID is not empty before going into commisioning because the bizLocation will be compared with senderID CHECK THIS INFO
                            for (let k in objectEvent) {
                                let bizStep = objectEvent[k].bizStep['#text'];

                                if (res.receiverIdOfLocation !== "") {
                                    // if (res.senderId !== "") {
                                    // res.receiverIdOfLocation
                                    if (bizStep.includes("commissioning")) {

                                        // Valida que exista BizLocation
                                        if (objectEvent[k].bizLocation) {
                                            let bizLocation = objectEvent[k].bizLocation.id['#text'];

                                            // With this validation we make sure that we are reading the commissioning event that has to do with the senderID
                                            // bizlocation ===res.senderID
                                            // if (bizLocation === res.receiverIdOfLocation) {
                                            if (bizLocation === res.senderId) {

                                                // Validate that these fields cannot be empty
                                                // Not empty: eventTime, eventTimeZoneOffset,epcList, lotNumber (extension=>ilmd=>lotNumber), itemExpirationDate
                                                // action === ADD DONE
                                                if (objectEvent[k].action['#text'] === "ADD") {
                                                    if (objectEvent[k].eventTime && objectEvent[k].eventTimeZoneOffset && objectEvent[k].epcList) {
                                                        if (objectEvent[k].extension) {
                                                            // ILMD is not mandatory if the commissioning event has SSCC in EPCs because there are non-homogenous containers
                                                            // In other words a SSCC is combined from different products of cases and bundles.
                                                            // The correct use of commissioning is to create a commissioning event for the cases,bundles or items that share the same lot number and expiration date.
                                                            if (objectEvent[k].extension.ilmd["cbvmda:lotNumber"] && objectEvent[k].extension.ilmd["cbvmda:itemExpirationDate"]) {
                                                                let epcArray = objectEvent[k].epcList.epc;
                                                                if (epcArray) {
                                                                    epcArray.forEach(epc => {
                                                                        if (!res.commissioning.includes(epc['#text'])) {
                                                                            res.commissioning.push(epc['#text']);
                                                                            if (!epc['#text'].includes('sscc')) {
                                                                                lotNumbersAndExpirationDate.push({
                                                                                    sgtin: epc['#text'],
                                                                                    lotNumber: objectEvent[k].extension.ilmd["cbvmda:lotNumber"]['#text'],
                                                                                    expirationDate: objectEvent[k].extension.ilmd["cbvmda:itemExpirationDate"]['#text']
                                                                                });
                                                                            }
                                                                        }
                                                                    })
                                                                } else {
                                                                    log.error({
                                                                        title: "Commissioning event incomplete",
                                                                        details: "Make sure to have epc in epcList"
                                                                    });
                                                                }
                                                            } else {
                                                                log.error({
                                                                    title: "Commisioning event incomplete",
                                                                    details: "Make sure to have lotNumber and itemExpirationDate information"
                                                                });
                                                            }
                                                        }
                                                    } else {
                                                        log.error({
                                                            title: "Commissioning event incomplete",
                                                            details: "make sure to have eventTime, eventTimeZoneOffset and epcList in commissioninh event"
                                                        });
                                                    }
                                                } else {
                                                    log.error({
                                                        title: "Commissioning event incomplete",
                                                        details: "Make sure that the action in commissioning event is ADD"
                                                    });
                                                }
                                            }
                                        } else {
                                            log.error({
                                                title: "bizLocation error",
                                                details: "field is mandatory"
                                            });
                                        }
                                    }
                                }
                            }


                        } else {
                            log.error({
                                title: "EPCIS file error",
                                details: "ObjectEvent not found"
                            });
                        }
                        // Hay de 2 para obtener listado de articulos involucrados en la transacción
                        // 1. Existe <transactionEvent> para cada purchase order (multiples purchase orders y singulares)
                        // 2. No existe <transactionEvent> pero primero te vas a packing
                        // SSCC (transactionEvent o shipping event)=>packing event parent ID => listado en packing event de los SGTIN =>packing event de cases SGTIN=>packing event para obtener single item
                        //Métodología
                        // 1. Obtener todos los SGTIN (cases y items) y SSCC del commissioning (listaCom) ya que este te da el listado de artículos a meter en la supply chain
                        // 2. Ir a transactionEvent si existe y obtener los SSCC o SGTIN padres por purchase Order
                        // 3. No tener transactionEvent => ir a packing pero con info de outermost containers que se encuentra en shipping
                        // del listado de commissioning si hay SSCC vamos a obtener los SGTIN (cases o items) involucrados
                        // una vez extraidos los SGTIN de SSCC se va a iterar dentro de packing nuevamente hasta que no exista un elemento no iterado de la listaCom
                        // Aquí finaliza metodología para extraer pallets,cases y items.
                        // Estructura de objeto deseada:

                        // pos:[{
                        // idPO:'1234',
                        // po_items:[{
                        //     sscc:[{
                        //         sgtin_cases:[{
                        //             sgtin_items:[]
                        //         }]
                        //     }],
                        //     sgtin_cases:[{
                        //         sgtin_items:[]
                        //     }],
                        //     sgtin_items:[]
                        // }]
                        let transactionEvent = jsonObj2.EPCISBody.EventList.TransactionEvent;
                        if (transactionEvent) {
                            for (let y in transactionEvent) {
                                // log.debug({
                                //     title: "transactionEvent[y]",
                                //     details: transactionEvent[y]
                                // });
                                if (transactionEvent[y].bizTransactionList) {
                                    // log.debug({
                                    //     title: "transactionEvent[y].bizTransactionList",
                                    //     details: transactionEvent[y].bizTransactionList
                                    // });
                                    if (transactionEvent[y].bizTransactionList.bizTransaction) {
                                        // log.debug({
                                        //     title: "transactionEvent[y].bizTransactionList.bizTransaction",
                                        //     details: transactionEvent[y].bizTransactionList.bizTransaction
                                        // });
                                        let bizTransaction_type = transactionEvent[y].bizTransactionList.bizTransaction._attributes.type;
                                        if (bizTransaction_type === "urn:epcglobal:cbv:btt:po") {
                                            // log.debug({
                                            //     title: "bizTransaction_type",
                                            //     details: bizTransaction_type
                                            // });
                                            let bizTransaction_po = transactionEvent[y].bizTransactionList.bizTransaction['#text'];
                                            // log.debug({
                                            //     title: "bizTransaction_po",
                                            //     details: bizTransaction_po
                                            // });
                                            for (let x in res.purchaseOrders) {
                                                if (bizTransaction_po === res.purchaseOrders[x]) {
                                                    // log.debug({
                                                    //     title: "bizTransaction_po - res.purchaseOrders[x]",
                                                    //     details: bizTransaction_po + '-' + res.purchaseOrders[x]
                                                    // });
                                                    // log.debug({
                                                    //     title: "bizTransaction_po === res.purchaseOrders[x]",
                                                    //     details: bizTransaction_po === res.purchaseOrders[x]
                                                    // });
                                                    let epcList = transactionEvent[y].epcList;
                                                    if (epcList) {
                                                        let epc = epcList.epc;
                                                        let epc_array = [];
                                                        if (epc.length) {
                                                            for (let epc_index in epc) {
                                                                epc_array.push(epc[epc_index]['#text']);
                                                            }
                                                        } else {
                                                            epc_array.push(epc['#text']);
                                                        }

                                                        var all_parentsID = getAllParentsID(packing_AggregationEvent);
                                                        // log.debug({
                                                        //     title: "All parents ID",
                                                        //     details: all_parentsID
                                                        // });
                                                        for (let o in epc_array) {
                                                            item_isParent(epc_array[o], res.commissioning, all_parentsID, packing_AggregationEvent);
                                                            // log.debug({
                                                            //     title: "global_obj_items_aux TI",
                                                            //     details: global_obj_items_aux
                                                            // });
                                                            const array_only_upper_parent = global_obj_items_aux.filter(obj => obj.hasOwnProperty('upper_parent'));
                                                            const array_without_upper_parent = global_obj_items_aux.filter(obj => !obj.hasOwnProperty('upper_parent'));
                                                            // log.debug({
                                                            //     title: "array_only_upper_parent TI",
                                                            //     details: array_only_upper_parent
                                                            // });
                                                            // log.debug({
                                                            //     title: "array_without_upper_parent TI",
                                                            //     details: array_without_upper_parent
                                                            // });
                                                            // *************FOR PACKING HIERARCHY JOIN ALL OBJECTS ***********************
                                                            const groupedArray = {};
                                                            const all_single_items = {};
                                                            const all_single_items_aux = {};
                                                            array_only_upper_parent.forEach(obj => {
                                                                const upperParentId = obj.upper_parent.id;
                                                                if (!groupedArray.hasOwnProperty(upperParentId)) {
                                                                    groupedArray[upperParentId] = {
                                                                        upper_parent: {
                                                                            id: upperParentId,
                                                                            single_items: [],
                                                                            parent_item: [obj.upper_parent.parent_item] // Make parent_item an array
                                                                        }
                                                                    };
                                                                } else {
                                                                    groupedArray[upperParentId].upper_parent.parent_item.push(obj.upper_parent.parent_item); // Push the original information into the array
                                                                }
                                                                if (!all_single_items.hasOwnProperty(upperParentId)) {
                                                                    all_single_items[upperParentId] = {
                                                                        single_items: []
                                                                    }
                                                                }
                                                                if (!all_single_items_aux.hasOwnProperty(upperParentId)) {
                                                                    all_single_items_aux[upperParentId] = {
                                                                        single_items: []
                                                                    }
                                                                }
                                                                all_single_items[upperParentId].single_items.push(...obj.upper_parent.single_items);
                                                                groupedArray[upperParentId].upper_parent.single_items.push(...all_single_items[upperParentId].single_items);
                                                            });
                                                            const resultArray = Object.values(groupedArray);
                                                            // log.audit({
                                                            //     title: "resultArray",
                                                            //     details: resultArray
                                                            // });
                                                            // mergedArray contains the structure well-formed of the cases,bundles and items without repeating ids,etc
                                                            const mergedArray = array_without_upper_parent.concat(resultArray);

                                                            // ***********************For PACKING EVENT *********************************
                                                            global_obj.push({
                                                                purchase_order: res.purchaseOrders[x],
                                                                outermost: {
                                                                    id: epc_array[o],
                                                                    single_items: global_obj_single_items,
                                                                    items_with_children: mergedArray
                                                                }
                                                            });
                                                            global_obj_items = [];
                                                            global_obj_items_aux = [];
                                                            global_obj_single_items = [];

                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        } else {
                            // Aquí va cuando no hay transactionEvent, es decir 1 sola purchase Order en Shipping
                            // Here only focus on reading the info in Shipping event for knowing the outermost container
                            // 1. Validate that only 1 purchase order is listed in bizTransactionList, else => the EPCIS file is wrong
                            // because if there are multiple Purchase Orders, a TransactionEvent is mandatory. DONE
                            // 2.  Vas a valer cheto haciendo el codigo de mapeo. Mis mejores deseos Magdiel
                            // This shippingEvent is the one that has business between the senderId and receiverId
                            if (shippingEvent !== [] && shippingEvent) {
                                if (res.purchaseOrders.length === 1) {
                                    // log.audit({
                                    //     title: "Shipping event will be used",
                                    //     details: shippingEvent
                                    // });
                                    for (let x in shippingEvent) {
                                        // log.debug({
                                        //     title: "shippingEvent[x]",
                                        //     details: shippingEvent[x]
                                        // });
                                        let epcList = shippingEvent[x].epcList;
                                        if (epcList) {
                                            let epc = epcList.epc;
                                            let epc_array = [];
                                            if (epc.length) {
                                                for (let epc_index in epc) {
                                                    epc_array.push(epc[epc_index]['#text']);
                                                }
                                            } else {
                                                epc_array.push(epc['#text']);
                                            }
                                            // log.debug({
                                            //     title: "SHIPPING EVENT EPCLIST",
                                            //     details: epc_array
                                            // });

                                            var all_parentsID = getAllParentsID(packing_AggregationEvent);
                                            for (let o in epc_array) {
                                                item_isParent(epc_array[o], res.commissioning, all_parentsID, packing_AggregationEvent);

                                                log.debug({
                                                    title: "global_obj_items_aux TI shipping",
                                                    details: global_obj_items_aux
                                                });

                                                const array_only_upper_parent = global_obj_items_aux.filter(obj => obj.hasOwnProperty('upper_parent'));

                                                const array_without_upper_parent = global_obj_items_aux.filter(obj => !obj.hasOwnProperty('upper_parent'));
                                                log.debug({
                                                    title: "array_only_upper_parent TI ship",
                                                    details: array_only_upper_parent
                                                });
                                                log.debug({
                                                    title: "array_without_upper_parent TI ship",
                                                    details: array_without_upper_parent
                                                });
                                                // *************FOR PACKING HIERARCHY JOIN ALL OBJECTS ***********************

                                                const groupedArray = {};
                                                const all_single_items = {};
                                                const all_single_items_aux = {};
                                                array_only_upper_parent.forEach(obj => {
                                                    const upperParentId = obj.upper_parent.id;
                                                    if (!groupedArray.hasOwnProperty(upperParentId)) {
                                                        groupedArray[upperParentId] = {
                                                            upper_parent: {
                                                                id: upperParentId,
                                                                single_items: [],
                                                                parent_item: [obj.upper_parent.parent_item] // Make parent_item an array
                                                            }
                                                        };
                                                    } else {
                                                        groupedArray[upperParentId].upper_parent.parent_item.push(obj.upper_parent.parent_item); // Push the original information into the array
                                                    }
                                                    if (!all_single_items.hasOwnProperty(upperParentId)) {
                                                        all_single_items[upperParentId] = {
                                                            single_items: []
                                                        }
                                                    }
                                                    if (!all_single_items_aux.hasOwnProperty(upperParentId)) {
                                                        all_single_items_aux[upperParentId] = {
                                                            single_items: []
                                                        }
                                                    }
                                                    log.debug({
                                                        title: "all_single_items_aux[upperParentId] TI ship",
                                                        details: all_single_items_aux[upperParentId]
                                                    })
                                                    all_single_items[upperParentId].single_items.push(...obj.upper_parent.single_items);
                                                    log.debug({
                                                        title: "all_single_items[upperParentId] TI ship",
                                                        details: all_single_items[upperParentId]
                                                    })
                                                    groupedArray[upperParentId].upper_parent.single_items.push(...all_single_items[upperParentId].single_items);
                                                });
                                                const resultArray = Object.values(groupedArray);
                                                log.audit({
                                                    title: "resultArray",
                                                    details: resultArray
                                                });
                                                // mergedArray contains the structure well-formed of the cases,bundles and items without repeating ids,etc
                                                const mergedArray = array_without_upper_parent.concat(resultArray);

                                                // ***********************For PACKING EVENT *********************************

                                                global_obj.push({
                                                    purchase_order: res.purchaseOrders[x],
                                                    outermost: {
                                                        id: epc_array[o],
                                                        single_items: global_obj_single_items,
                                                        items_with_children: mergedArray
                                                    }
                                                });
                                                global_obj_items = [];
                                                global_obj_items_aux = [];
                                                global_obj_single_items = [];

                                            }
                                        }
                                    }
                                } else {
                                    log.error({
                                        title: "Shipping event incomplete",
                                        details: "There are multiple purchase orders found, use Transaction Event"
                                    });
                                }
                            }
                        }
                        log.debug({
                            title: "global_obj",
                            details: global_obj
                        });
                        res.transactionEvent = global_obj;
                    } else {
                        log.error({
                            title: "EPCIS file error",
                            details: "EventList not found"
                        });
                    }
                } else {
                    log.error({
                        title: "EPCIS file error",
                        details: "EPCISBody not found"
                    });
                }
                // Análisis de Master Data para obtener información detallada a partir de SGLN y SGTIN
                let aux_arrayProducts = [];
                let aux_addresses = [];
                let aux_sender_info = {};
                let aux_receiver_info = {};
                let epcisMasterData = jsonObj2.EPCISHeader.extension['EPCISMasterData'];
                if (epcisMasterData) {
                    let vocabularyList = epcisMasterData['VocabularyList'];
                    let vocabularyList_array = [];
                    if (vocabularyList.length) {
                        for (let x in vocabularyList) {
                            vocabularyList_array.push(vocabularyList[x]);
                        }
                    } else {
                        vocabularyList_array.push(vocabularyList);
                    }
                    for (let j in vocabularyList_array) {
                        // log.debug({
                        //     title: "vocabularyList_array[j]",
                        //     details: vocabularyList_array[j]
                        // });
                        for (let k in vocabularyList_array[j]) {
                            // log.debug({
                            //     title: "vocabularyList_array[j][k]",
                            //     details: vocabularyList_array[j][k]
                            // })
                            if (vocabularyList_array[j][k] !== '') {
                                for (let x in vocabularyList_array[j][k]) {
                                    let attributes = vocabularyList_array[j][k][x]._attributes;
                                    // log.debug({
                                    //     title: "attributes",
                                    //     details: vocabularyList_array[j][k][x]._attributes
                                    // });
                                    if (attributes) {
                                        // EPCClass if for information of the products described in transaction
                                        if (attributes['type'] === "urn:epcglobal:epcis:vtype:EPCClass") {
                                            // log.debug({
                                            //     title: "attributes['type'] === 'urn:epcglobal:epcis:vtype:EPCClass'",
                                            //     details: attributes['type'] === "urn:epcglobal:epcis:vtype:EPCClass"
                                            // })
                                            let vocabularyElement = vocabularyList_array[j][k][x].VocabularyElementList.VocabularyElement;
                                            let arrayProducts = [];
                                            for (let m in vocabularyElement) {
                                                // log.emergency({
                                                //     title: "vocabularyElement[m] EPCClass TI",
                                                //     details: vocabularyElement[m]
                                                // });
                                                if (vocabularyElement[m]._attributes) {
                                                    let idVocabularyElement = vocabularyElement[m]._attributes.id;
                                                    if (res.commissioning.length > 0) {
                                                        res.commissioning.forEach(singleSGTIN => {
                                                            // log.debug({
                                                            //     title: "Entered for iteration of sgtin",
                                                            //     details: true
                                                            // });
                                                            const searchStr = "sgtin:";
                                                            const startIndexSGTINres = singleSGTIN.indexOf(searchStr) + searchStr.length;
                                                            const startIndexIdVocabulary = idVocabularyElement.indexOf(searchStr) + searchStr.length;
                                                            const singleSGTINfromres = singleSGTIN.substring(startIndexSGTINres);
                                                            const singleSGTINfromres_pt = singleSGTINfromres.split(".")[0] + singleSGTINfromres.split(".")[1];
                                                            const singleidVocabularyElement = idVocabularyElement.substring(startIndexIdVocabulary);
                                                            const singleidVocabularyElement_pt = singleidVocabularyElement.split(".")[0] + singleidVocabularyElement.split(".")[1];
                                                            if (singleidVocabularyElement_pt === singleSGTINfromres_pt) {
                                                                let productInfo = {
                                                                    sgtin: '',
                                                                    itemIdentification: '',
                                                                    itemIdentificationTypeCode: '',
                                                                    productName: '',
                                                                    nameManufacturerOrTrader: '',
                                                                    dosage: '',
                                                                    strength: '',
                                                                    containerSize: '',
                                                                    lotNumber: '',
                                                                    expirationDate: ''
                                                                };
                                                                for (let n in vocabularyElement[m].attribute) {
                                                                    // log.debug({
                                                                    //     title: "Entered for iteration of attribute of vocabularyElement",
                                                                    //     details: true
                                                                    // });
                                                                    let idVocabularyElement_single = vocabularyElement[m].attribute[n]._attributes.id;
                                                                    switch (idVocabularyElement_single) {
                                                                        case 'urn:epcglobal:cbv:mda#additionalTradeItemIdentification':
                                                                            productInfo.itemIdentification = vocabularyElement[m].attribute[n]["#text"];
                                                                            break;
                                                                        case 'urn:epcglobal:cbv:mda#additionalTradeItemIdentificationTypeCode':
                                                                            productInfo.itemIdentificationTypeCode = vocabularyElement[m].attribute[n]["#text"];
                                                                            break;
                                                                        case 'urn:epcglobal:cbv:mda#regulatedProductName':
                                                                            productInfo.productName = vocabularyElement[m].attribute[n]["#text"];
                                                                            break;
                                                                        case 'urn:epcglobal:cbv:mda#manufacturerOfTradeItemPartyName':
                                                                            productInfo.nameManufacturerOrTrader = vocabularyElement[m].attribute[n]["#text"];
                                                                            break;
                                                                        case 'urn:epcglobal:cbv:mda#dosageFormType':
                                                                            productInfo.dosage = vocabularyElement[m].attribute[n]["#text"];
                                                                            break;
                                                                        case 'urn:epcglobal:cbv:mda#strengthDescription':
                                                                            productInfo.strength = vocabularyElement[m].attribute[n]["#text"];
                                                                            break;
                                                                        case 'urn:epcglobal:cbv:mda#netContentDescription':
                                                                            productInfo.containerSize = vocabularyElement[m].attribute[n]["#text"];
                                                                            break;
                                                                        default: log.error({
                                                                            title: "EPCIS Master Data error",
                                                                            details: "id in VocabularyElement in EPCClass is not allowed: " + idVocabularyElement_single
                                                                        });
                                                                            break;
                                                                    }
                                                                }
                                                                productInfo.sgtin = singleSGTIN
                                                                let obj_expiry_lotnumber = setExpiryAndLotNumber(singleSGTIN, lotNumbersAndExpirationDate);
                                                                if (obj_expiry_lotnumber !== {}) {
                                                                    productInfo.lotNumber = obj_expiry_lotnumber.lotNumber;
                                                                    productInfo.expirationDate = obj_expiry_lotnumber.expirationDate;
                                                                } else {
                                                                    log.error({
                                                                        title: "EPCIS file error",
                                                                        details: "There are no lot numbers or expiration date on items in commissioning"
                                                                    });
                                                                }
                                                                arrayProducts.push(productInfo);
                                                            }
                                                        });
                                                    }
                                                }
                                                // } else {
                                                //     log.error({
                                                //         title: "EPCIS Master Data error",
                                                //         details: "VocabularyElement must contain an id"
                                                //     });
                                                // }
                                            }
                                            aux_arrayProducts = arrayProducts;
                                        }
                                        if (attributes['type'] === "urn:epcglobal:epcis:vtype:Location") {
                                            let vocabularyElement = vocabularyList_array[j][k][x].VocabularyElementList.VocabularyElement;
                                            let arrayAddresses = [];
                                            for (let m in vocabularyElement) {
                                                let idVocabularyElement = vocabularyElement[m]._attributes.id;
                                                if (res.senderIdOfLocationOrigin) {
                                                    const searchStr = "sgln:";
                                                    const startIndexSGLNres = res.senderIdOfLocationOrigin.indexOf(searchStr) + searchStr.length;
                                                    const startIndexIdVocabulary = idVocabularyElement.indexOf(searchStr) + searchStr.length;
                                                    const singleSGLNfromres = res.senderIdOfLocationOrigin.substring(startIndexSGLNres);
                                                    const singleSGLNfromres_pt = singleSGLNfromres.split(".")[0] + singleSGLNfromres.split(".")[1];
                                                    const singleidVocabularyElement = idVocabularyElement.substring(startIndexIdVocabulary);
                                                    const singleidVocabularyElement_pt = singleidVocabularyElement.split(".")[0] + singleidVocabularyElement.split(".")[1];
                                                    if (singleidVocabularyElement_pt === singleSGLNfromres_pt) {
                                                        let address_info = {
                                                            sgln: '',
                                                            name: '',
                                                            streetAddressOne: '',
                                                            streetAddressTwo: '',
                                                            city: '',
                                                            state: '',
                                                            postalCode: '',
                                                            countryCode: ''
                                                        }
                                                        for (let n in vocabularyElement[m].attribute) {
                                                            let idVocabularyElement_single = vocabularyElement[m].attribute[n]._attributes.id;
                                                            switch (idVocabularyElement_single) {
                                                                case 'urn:epcglobal:cbv:mda#name':
                                                                    address_info.name = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                case 'urn:epcglobal:cbv:mda#streetAddressOne':
                                                                    address_info.streetAddressOne = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                case 'urn:epcglobal:cbv:mda#streetAddressTwo':
                                                                    address_info.streetAddressTwo = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                case 'urn:epcglobal:cbv:mda#city':
                                                                    address_info.city = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                case 'urn:epcglobal:cbv:mda#name':
                                                                    address_info.name = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                case 'urn:epcglobal:cbv:mda#state':
                                                                    address_info.state = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                case 'urn:epcglobal:cbv:mda#postalCode':
                                                                    address_info.postalCode = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                case 'urn:epcglobal:cbv:mda#countryCode':
                                                                    address_info.countryCode = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                default: log.error({
                                                                    title: "EPCIS Master Data error",
                                                                    details: "id in Vocabulary Element in Location is not allowed: " + idVocabularyElement_single
                                                                });
                                                                    break;

                                                            }
                                                        }
                                                        address_info.sgln = res.senderIdOfLocationOrigin;
                                                        arrayAddresses.push(address_info);
                                                    }
                                                }
                                                if (res.receiverIdOfLocation) {
                                                    const searchStr = "sgln:";
                                                    const startIndexSGLNres = res.receiverIdOfLocation.indexOf(searchStr) + searchStr.length;
                                                    const startIndexIdVocabulary = idVocabularyElement.indexOf(searchStr) + searchStr.length;
                                                    const singleSGLNfromres = res.receiverIdOfLocation.substring(startIndexSGLNres);
                                                    const singleSGLNfromres_pt = singleSGLNfromres.split(".")[0] + singleSGLNfromres.split(".")[1];
                                                    const singleidVocabularyElement = idVocabularyElement.substring(startIndexIdVocabulary);
                                                    const singleidVocabularyElement_pt = singleidVocabularyElement.split(".")[0] + singleidVocabularyElement.split(".")[1];
                                                    if (singleidVocabularyElement_pt === singleSGLNfromres_pt) {
                                                        let address_info = {
                                                            sgln: '',
                                                            name: '',
                                                            streetAddressOne: '',
                                                            streetAddressTwo: '',
                                                            city: '',
                                                            state: '',
                                                            postalCode: '',
                                                            countryCode: ''
                                                        }
                                                        for (let n in vocabularyElement[m].attribute) {
                                                            let idVocabularyElement_single = vocabularyElement[m].attribute[n]._attributes.id;
                                                            switch (idVocabularyElement_single) {
                                                                case 'urn:epcglobal:cbv:mda#name':
                                                                    address_info.name = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                case 'urn:epcglobal:cbv:mda#streetAddressOne':
                                                                    address_info.streetAddressOne = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                case 'urn:epcglobal:cbv:mda#streetAddressTwo':
                                                                    address_info.streetAddressTwo = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                case 'urn:epcglobal:cbv:mda#city':
                                                                    address_info.city = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                case 'urn:epcglobal:cbv:mda#name':
                                                                    address_info.name = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                case 'urn:epcglobal:cbv:mda#state':
                                                                    address_info.state = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                case 'urn:epcglobal:cbv:mda#postalCode':
                                                                    address_info.postalCode = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                case 'urn:epcglobal:cbv:mda#countryCode':
                                                                    address_info.countryCode = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                default: log.error({
                                                                    title: "EPCIS Master Data error",
                                                                    details: "id in Vocabulary Element in Location is not allowed: " + idVocabularyElement_single
                                                                });
                                                                    break;

                                                            }
                                                        }
                                                        address_info.sgln = res.receiverIdOfLocation;
                                                        arrayAddresses.push(address_info);
                                                    }
                                                }
                                                if (res.senderId) {
                                                    const searchStr = "sgln:";
                                                    const startIndexSGLNres = res.senderId.indexOf(searchStr) + searchStr.length;
                                                    const startIndexIdVocabulary = idVocabularyElement.indexOf(searchStr) + searchStr.length;
                                                    const singleSGLNfromres = res.senderId.substring(startIndexSGLNres);
                                                    const singleSGLNfromres_pt = singleSGLNfromres.split(".")[0] + singleSGLNfromres.split(".")[1];
                                                    const singleidVocabularyElement = idVocabularyElement.substring(startIndexIdVocabulary);
                                                    const singleidVocabularyElement_pt = singleidVocabularyElement.split(".")[0] + singleidVocabularyElement.split(".")[1];
                                                    if (singleidVocabularyElement_pt === singleSGLNfromres_pt) {
                                                        let address_info = {
                                                            sgln: '',
                                                            name: '',
                                                            streetAddressOne: '',
                                                            streetAddressTwo: '',
                                                            city: '',
                                                            state: '',
                                                            postalCode: '',
                                                            countryCode: ''
                                                        }
                                                        for (let n in vocabularyElement[m].attribute) {
                                                            let idVocabularyElement_single = vocabularyElement[m].attribute[n]._attributes.id;
                                                            switch (idVocabularyElement_single) {
                                                                case 'urn:epcglobal:cbv:mda#name':
                                                                    address_info.name = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                case 'urn:epcglobal:cbv:mda#streetAddressOne':
                                                                    address_info.streetAddressOne = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                case 'urn:epcglobal:cbv:mda#streetAddressTwo':
                                                                    address_info.streetAddressTwo = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                case 'urn:epcglobal:cbv:mda#city':
                                                                    address_info.city = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                case 'urn:epcglobal:cbv:mda#name':
                                                                    address_info.name = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                case 'urn:epcglobal:cbv:mda#state':
                                                                    address_info.state = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                case 'urn:epcglobal:cbv:mda#postalCode':
                                                                    address_info.postalCode = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                case 'urn:epcglobal:cbv:mda#countryCode':
                                                                    address_info.countryCode = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                default: log.error({
                                                                    title: "EPCIS Master Data error",
                                                                    details: "id in Vocabulary Element in Location is not allowed: " + idVocabularyElement_single
                                                                });
                                                                    break;

                                                            }
                                                        }
                                                        address_info.sgln = res.senderId;
                                                        arrayAddresses.push(address_info);
                                                    }
                                                }
                                                if (res.receiverId) {
                                                    const searchStr = "sgln:";
                                                    const startIndexSGLNres = res.receiverId.indexOf(searchStr) + searchStr.length;
                                                    const startIndexIdVocabulary = idVocabularyElement.indexOf(searchStr) + searchStr.length;
                                                    const singleSGLNfromres = res.receiverId.substring(startIndexSGLNres);
                                                    const singleSGLNfromres_pt = singleSGLNfromres.split(".")[0] + singleSGLNfromres.split(".")[1];
                                                    const singleidVocabularyElement = idVocabularyElement.substring(startIndexIdVocabulary);
                                                    const singleidVocabularyElement_pt = singleidVocabularyElement.split(".")[0] + singleidVocabularyElement.split(".")[1];
                                                    if (singleidVocabularyElement_pt === singleSGLNfromres_pt) {
                                                        let address_info = {
                                                            sgln: '',
                                                            name: '',
                                                            streetAddressOne: '',
                                                            streetAddressTwo: '',
                                                            city: '',
                                                            state: '',
                                                            postalCode: '',
                                                            countryCode: ''
                                                        }
                                                        for (let n in vocabularyElement[m].attribute) {
                                                            let idVocabularyElement_single = vocabularyElement[m].attribute[n]._attributes.id;
                                                            switch (idVocabularyElement_single) {
                                                                case 'urn:epcglobal:cbv:mda#name':
                                                                    address_info.name = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                case 'urn:epcglobal:cbv:mda#streetAddressOne':
                                                                    address_info.streetAddressOne = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                case 'urn:epcglobal:cbv:mda#streetAddressTwo':
                                                                    address_info.streetAddressTwo = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                case 'urn:epcglobal:cbv:mda#city':
                                                                    address_info.city = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                case 'urn:epcglobal:cbv:mda#name':
                                                                    address_info.name = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                case 'urn:epcglobal:cbv:mda#state':
                                                                    address_info.state = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                case 'urn:epcglobal:cbv:mda#postalCode':
                                                                    address_info.postalCode = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                case 'urn:epcglobal:cbv:mda#countryCode':
                                                                    address_info.countryCode = vocabularyElement[m].attribute[n]["#text"];
                                                                    break;
                                                                default: log.error({
                                                                    title: "EPCIS Master Data error",
                                                                    details: "id in Vocabulary Element in Location is not allowed: " + idVocabularyElement_single
                                                                });
                                                                    break;

                                                            }
                                                        }
                                                        address_info.sgln = res.receiverId;
                                                        arrayAddresses.push(address_info);
                                                    }
                                                }
                                            }
                                            log.debug({
                                                title: "arrayAddresses",
                                                details: arrayAddresses
                                            });
                                            aux_addresses = arrayAddresses;
                                            // Aquí inicia lo de poner estructura a lo de la info de SENDER y RECEIVER. Es poner el id y sus direcciones
                                            log.debug({
                                                title: "RES SENDER",
                                                details: res.senderId
                                            });
                                            // for the SENDER INFO
                                            aux_sender_info = {
                                                sender: {

                                                },
                                                senderOfLocationOrigin: {

                                                }
                                            }
                                            aux_receiver_info = {
                                                receiver: {

                                                },
                                                receiverOfLocationOrigin: {

                                                }
                                            }
                                            aux_addresses.forEach(address => {
                                                if (address.sgln === res.senderId) {
                                                    aux_sender_info.sender.senderId = address.sgln;
                                                    aux_sender_info.sender.name = address.name;
                                                    aux_sender_info.sender.streetAddressOne = address.streetAddressOne;
                                                    aux_sender_info.sender.streetAddressTwo = address.streetAddressTwo;
                                                    aux_sender_info.sender.city = address.city;
                                                    aux_sender_info.sender.state = address.state;
                                                    aux_sender_info.sender.postalCode = address.postalCode;
                                                    aux_sender_info.sender.countryCode = address.countryCode;
                                                }
                                                if (address.sgln === res.senderIdOfLocationOrigin) {
                                                    aux_sender_info.senderOfLocationOrigin.senderId = address.sgln;
                                                    aux_sender_info.senderOfLocationOrigin.name = address.name;
                                                    aux_sender_info.senderOfLocationOrigin.streetAddressOne = address.streetAddressOne;
                                                    aux_sender_info.senderOfLocationOrigin.streetAddressTwo = address.streetAddressTwo;
                                                    aux_sender_info.senderOfLocationOrigin.city = address.city;
                                                    aux_sender_info.senderOfLocationOrigin.state = address.state;
                                                    aux_sender_info.senderOfLocationOrigin.postalCode = address.postalCode;
                                                    aux_sender_info.senderOfLocationOrigin.countryCode = address.countryCode;

                                                }
                                                if (address.sgln === res.receiverId) {
                                                    aux_receiver_info.receiver.receiverId = address.sgln;
                                                    aux_receiver_info.receiver.name = address.name;
                                                    aux_receiver_info.receiver.streetAddressOne = address.streetAddressOne;
                                                    aux_receiver_info.receiver.streetAddressTwo = address.streetAddressTwo;
                                                    aux_receiver_info.receiver.city = address.city;
                                                    aux_receiver_info.receiver.state = address.state;
                                                    aux_receiver_info.receiver.postalCode = address.postalCode;
                                                    aux_receiver_info.receiver.countryCode = address.countryCode;
                                                }
                                                if (address.sgln === res.receiverIdOfLocation) {
                                                    aux_receiver_info.receiverOfLocationOrigin.receiverId = address.sgln;
                                                    aux_receiver_info.receiverOfLocationOrigin.name = address.name;
                                                    aux_receiver_info.receiverOfLocationOrigin.streetAddressOne = address.streetAddressOne;
                                                    aux_receiver_info.receiverOfLocationOrigin.streetAddressTwo = address.streetAddressTwo;
                                                    aux_receiver_info.receiverOfLocationOrigin.city = address.city;
                                                    aux_receiver_info.receiverOfLocationOrigin.state = address.state;
                                                    aux_receiver_info.receiverOfLocationOrigin.postalCode = address.postalCode;
                                                    aux_receiver_info.receiverOfLocationOrigin.countryCode = address.countryCode;
                                                }
                                            });

                                        }
                                    }
                                }
                            }
                        }
                    }
                } else {
                    log.error({
                        title: "EPCIS file error",
                        details: "EPCISMasterData not found"
                    });
                }
                // log.debug({
                //     title: "aux_arrayProducts",
                //     details: aux_arrayProducts
                // });
                res.products_information = aux_arrayProducts;
                res.addresses = aux_addresses;
                res.sender_info = aux_sender_info;
                res.receiver_info = aux_receiver_info;
                return res;
            } catch (err) {
                log.error({
                    title: "Error occurred in getTransactionInformationSummary",
                    details: err
                });
            }
        }
        function setExpiryAndLotNumber(sgtin, array_info) {
            try {
                let response = {
                    lotNumber: '',
                    expirationDate: ''
                };
                if (array_info.length > 0) {
                    array_info.forEach(element => {
                        if (element.sgtin === sgtin) {
                            response.lotNumber = element.lotNumber;
                            response.expirationDate = element.expirationDate;
                        }
                    });
                } else {
                    log.error({
                        title: "EPCIS file error",
                        details: "Please include the lot number and expiration Dates in ILMD in commissioning event"
                    });
                }
                return response;
            } catch (err) {
                log.error({
                    title: "Error occurred in SetExpiryAndLotNumber",
                    details: err
                });
                return {};
            }
        }
        function item_isParent_receiving(parent_PO_item, item_list, parent_ids, aggregationEvent) {
            try {
                // You have the item list from the commissioning and the parentPOitem that is can either be a SGTIN or SSCC
                // parent_ids are all the parent cases or pallets 
                // Aggregation Event is the packing event

                //item_list type is array
                // parent_ids is array
                // parent_PO_item is string
                // aggregationEvent array of objects

                // Loop through aggregationEvent and if the parent id matches one of the parent_ids AND parent_PO_item...
                // Get the EPCList and loop through them and check if it matched one of the parent_ids...
                // If TRUE: get the EPCList and loop through them and check if it matched one of the parent_ids. STORE SGTIN OF CASE in array of objects
                // If TRUE: get the EPCList and loop through them and check if it matches one of the parent_ids. STORE SGTIN OF PACK/BUNDLE in array of objects
                // If TRUE:get the EPCList and STORE SGTINs of items in array of objects.
                // If FALSE: send empty but with error because you cannot have a PACK/BUNDLE without especifying the content of the single item.
                // If FALSE: the SGTIN is a case with single items. STORE SGTINs of items in array of objects
                // If FALSE: then parent_PO_item is SGTIN case that only contains single items. STORE SGTINs of items in array of objects
                let aux_aggregationEvent = [];
                if (aggregationEvent) {
                    if (aggregationEvent.length) {
                        for (let i in aggregationEvent) {
                            aux_aggregationEvent.push(aggregationEvent[i]);
                        }
                    } else {
                        aux_aggregationEvent.push(aggregationEvent);
                    }
                }
                if (aux_aggregationEvent) {
                    for (let i in aux_aggregationEvent) {
                        // log.debug({
                        //     title: "aux_aggregationEvent[i].parentID['#text']",
                        //     details: aux_aggregationEvent[i].parentID["#text"]
                        // });
                        // Checa si el current aggregation event es el del parent_PO_item
                        if (aux_aggregationEvent[i].parentID["#text"] === parent_PO_item) {
                            let index_of_AggregationEventThatHas_parentPO_item = i;
                            let childEPCs = aux_aggregationEvent[index_of_AggregationEventThatHas_parentPO_item].childEPCs;
                            // log.debug({
                            //     title: "childEPCs",
                            //     details: childEPCs
                            // });
                            let childEPCs_array = [];
                            if (childEPCs.epc.length) {
                                // childEPCs is array
                                for (let j in childEPCs.epc) {
                                    childEPCs_array.push(childEPCs.epc[j]['#text']);
                                }
                            } else {
                                // only has single 1 epc element and is not array
                                childEPCs_array.push(childEPCs.epc['#text']);
                            }
                            // log.debug({
                            //     title: "childEPCs_array",
                            //     details: childEPCs_array
                            // });
                            // check if any epc of chilEPCs_array is a parentID
                            let is_epc_parent = isParent(childEPCs_array, parent_ids);
                            // log.debug({
                            //     title: "is_epc_parent",
                            //     details: is_epc_parent
                            // });
                            // Iterate over the array of the is_epc_parent response. Find the index of the aggregation event that has that parentID
                            // get the childEPCs and check again.
                            iterateOverAggregationEvent_receiving(is_epc_parent, parent_ids, aux_aggregationEvent, childEPCs_array);
                            // log.debug({
                            //     title: "global_obj_items_receiving",
                            //     details: global_obj_items_receiving
                            // });
                            // NOTE: childEPCs_array is the whole list of content within the PO
                            // Now create a new list excluding the parent_items from childEPCs_array
                            let exclude_parent_items_from_childEPCs_array = listOfExcludedParentItems(global_obj_items_receiving, childEPCs_array);
                            // log.debug({
                            //     title: "exclude_parent_items_from_childEPCs_array",
                            //     details: exclude_parent_items_from_childEPCs_array
                            // });
                            global_obj_single_items_receiving = exclude_parent_items_from_childEPCs_array;
                            // log.emergency({
                            //     title: "global_obj_single_items_receiving",
                            //     details: global_obj_single_items_receiving
                            // });
                            // En este punto se debe de obtener una estructura asi
                            // obj.push({
                            //     outermost:{
                            //         sscc_or_sgtin:parent_PO_item,
                            //         childSGTIN:obj_childSGTIN
                            //     }
                            // });
                        }
                    }
                } else {
                    log.error({
                        title: "EPCIS file error",
                        details: "Aggregation event is mandatory"
                    });
                }
            } catch (err) {
                log.error({
                    title: "Error occurred on item_isParent_receiving()",
                    details: err
                });
            }
        }

        function item_isParent(parent_PO_item, item_list, parent_ids, aggregationEvent) {
            try {
                // You have the item list from the commissioning and the parentPOitem that is can either be a SGTIN or SSCC
                // parent_ids are all the parent cases or pallets 
                // Aggregation Event is the packing event

                //item_list type is array
                // parent_ids is array
                // parent_PO_item is string
                // aggregationEvent array of objects

                // Loop through aggregationEvent and if the parent id matches one of the parent_ids AND parent_PO_item...
                // Get the EPCList and loop through them and check if it matched one of the parent_ids...
                // If TRUE: get the EPCList and loop through them and check if it matched one of the parent_ids. STORE SGTIN OF CASE in array of objects
                // If TRUE: get the EPCList and loop through them and check if it matches one of the parent_ids. STORE SGTIN OF PACK/BUNDLE in array of objects
                // If TRUE:get the EPCList and STORE SGTINs of items in array of objects.
                // If FALSE: send empty but with error because you cannot have a PACK/BUNDLE without especifying the content of the single item.
                // If FALSE: the SGTIN is a case with single items. STORE SGTINs of items in array of objects
                // If FALSE: then parent_PO_item is SGTIN case that only contains single items. STORE SGTINs of items in array of objects
                let aux_aggregationEvent = [];
                if (aggregationEvent) {
                    if (aggregationEvent.length) {
                        for (let i in aggregationEvent) {
                            aux_aggregationEvent.push(aggregationEvent[i]);
                        }
                    } else {
                        aux_aggregationEvent.push(aggregationEvent);
                    }
                }
                if (aux_aggregationEvent) {
                    for (let i in aux_aggregationEvent) {
                        // log.debug({
                        //     title: "aux_aggregationEvent[i].parentID['#text']",
                        //     details: aux_aggregationEvent[i].parentID["#text"]
                        // });
                        // Checa si el current aggregation event es el del parent_PO_item
                        if (aux_aggregationEvent[i].parentID["#text"] === parent_PO_item) {
                            let index_of_AggregationEventThatHas_parentPO_item = i;
                            let childEPCs = aux_aggregationEvent[index_of_AggregationEventThatHas_parentPO_item].childEPCs;
                            // log.debug({
                            //     title: "childEPCs",
                            //     details: childEPCs
                            // });
                            let childEPCs_array = [];
                            if (childEPCs.epc.length) {
                                // childEPCs is array
                                for (let j in childEPCs.epc) {
                                    childEPCs_array.push(childEPCs.epc[j]['#text']);
                                }
                            } else {
                                // only has single 1 epc element and is not array
                                childEPCs_array.push(childEPCs.epc['#text']);
                            }
                            // log.debug({
                            //     title: "childEPCs_array",
                            //     details: childEPCs_array
                            // });
                            // check if any epc of chilEPCs_array is a parentID
                            let is_epc_parent = isParent(childEPCs_array, parent_ids);
                            // log.debug({
                            //     title: "is_epc_parent",
                            //     details: is_epc_parent
                            // });
                            // Iterate over the array of the is_epc_parent response. Find the index of the aggregation event that has that parentID
                            // get the childEPCs and check again.
                            iterateOverAggregationEvent(is_epc_parent, parent_ids, aux_aggregationEvent, childEPCs_array);
                            log.debug({
                                title: "global_obj_items TI",
                                details: global_obj_items
                            });
                            // NOTE: childEPCs_array is the whole list of content within the PO
                            // Now create a new list excluding the parent_items from childEPCs_array
                            let exclude_parent_items_from_childEPCs_array = listOfExcludedParentItems(global_obj_items, childEPCs_array);
                            log.debug({
                                title: "exclude_parent_items_from_childEPCs_array",
                                details: exclude_parent_items_from_childEPCs_array
                            });
                            global_obj_single_items = exclude_parent_items_from_childEPCs_array;
                            // En este punto se debe de obtener una estructura asi
                            // obj.push({
                            //     outermost:{
                            //         sscc_or_sgtin:parent_PO_item,
                            //         childSGTIN:obj_childSGTIN
                            //     }
                            // });
                        }
                    }
                } else {
                    log.error({
                        title: "EPCIS file error",
                        details: "Aggregation event is mandatory"
                    });
                }
            } catch (err) {
                log.error({
                    title: "Error occurred on item_isParent()",
                    details: err
                });
            }
        }
        function listOfExcludedParentItems(obj_items, childEPCs_array) {
            log.audit({
                title: "obj_items",
                details: obj_items
            });
            log.audit({
                title: "childEPCs_array",
                details: childEPCs_array
            });
            try {
                let arr_parent_items = [];
                if (Array.isArray(obj_items)) {
                    log.audit({
                        title: "isArray",
                        details: true
                    })
                    for (let i in obj_items) {
                        if (obj_items[i].parent_item) {
                            if (obj_items[i].parent_item) {
                                if (!arr_parent_items.includes(obj_items[i].parent_item.id)) {

                                    arr_parent_items.push(obj_items[i].parent_item.id);
                                }
                            }
                        } else {
                            if (obj_items[i].upper_parent.id) {
                                arr_parent_items.push(obj_items[i].upper_parent.id);
                                if (obj_items[i].upper_parent.parent_item) {
                                    if (!arr_parent_items.includes(obj_items[i].upper_parent.parent_item.id)) {
                                        arr_parent_items.push(obj_items[i].upper_parent.parent_item.id);
                                    }
                                }
                            } else {
                                if (!arr_parent_items.includes(obj_items[i].upper_parent.parent_item.id)) {

                                    arr_parent_items.push(obj_items[i].upper_parent.parent_item.id);
                                }
                            }
                        }
                    }
                } else {
                    log.audit({
                        title: "isArray",
                        details: false
                    })
                    if (!arr_parent_items.includes(obj_items)) {
                        arr_parent_items.push(obj_items);
                    }
                }
                log.audit({
                    title: "arr_parents_items",
                    details: arr_parent_items
                });
                const excludedItems = childEPCs_array.filter(item => !arr_parent_items.includes(item));
                return excludedItems;
            } catch (err) {
                log.error({
                    title: "Error occurred in ListOfExcludedParentItems()",
                    details: err
                })
            }
        }
        function iterateOverAggregationEvent_receiving(epc_array, parent_ids, aggregationEvent, childEPCs_array, parent_analyzed) {
            try {
                var obj_to_return = [];
                if (epc_array === []) {
                    // Means that inside the case or bundle there are only single items therefore, return an array
                    // obj_to_return = childEPCs_array;
                    log.debug({
                        title: "No children added, ends here",
                        details: childEPCs_array
                    });
                } else {
                    if (aggregationEvent) {
                        for (let j in epc_array) {
                            for (let i in aggregationEvent) {
                                if (aggregationEvent[i].parentID["#text"] === epc_array[j]) {
                                    let index_i = i;
                                    let childEPCs = aggregationEvent[index_i].childEPCs;
                                    let childEPCs_array2 = [];
                                    if (childEPCs.epc.length) {
                                        for (let k in childEPCs.epc) {
                                            childEPCs_array2.push(childEPCs.epc[k]['#text']);
                                        }
                                    } else {
                                        childEPCs_array2.push(childEPCs.epc['#text']);
                                    }
                                    // log.debug({
                                    //     title: "parentID analyzed",
                                    //     details: epc_array[j]
                                    // });
                                    // log.debug({
                                    //     title: "childEPCs_array2",
                                    //     details: childEPCs_array2
                                    // });
                                    let is_epc_parent = isParent(childEPCs_array2, parent_ids);
                                    // log.debug({
                                    //     title: "is_epc_parent in second level BUNDLE",
                                    //     details: is_epc_parent.length
                                    // });
                                    if (is_epc_parent.length === 0) {
                                        if (typeof parent_analyzed !== undefined && parent_analyzed && parent_analyzed !== "") {
                                            let remaining_nonparent_items = listOfExcludedParentItems(epc_array[j], childEPCs_array);
                                            log.debug({
                                                title: "remaining_nonparent_items",
                                                details: remaining_nonparent_items
                                            });
                                            obj_to_return = {
                                                upper_parent: {
                                                    id: parent_analyzed,
                                                    single_items: remaining_nonparent_items,
                                                    parent_item: {
                                                        id: epc_array[j],
                                                        children_items: childEPCs_array2
                                                    }
                                                }
                                            }
                                        } else {
                                            obj_to_return = {
                                                parent_item: {
                                                    id: epc_array[j],
                                                    children_items: childEPCs_array2
                                                }
                                            }
                                        }
                                        if (!global_obj_items_receiving.some(obj => obj.parent_item.id === obj_to_return.parent_item.id)) {
                                            global_obj_items_receiving.push(obj_to_return);
                                        }
                                        // log.debug({
                                        //     title: "obj_to_return",
                                        //     details: obj_to_return
                                        // });
                                        global_obj_items_aux_receiving = global_obj_items_receiving;
                                        // log.emergency({
                                        //     title: "global_obj_items_aux_receiving",
                                        //     details: global_obj_items_aux_receiving
                                        // })
                                        // log.audit({
                                        //     title: "searchResults",
                                        //     details: searchResults
                                        // });
                                    } else {
                                        iterateOverAggregationEvent_receiving(is_epc_parent, parent_ids, aggregationEvent, childEPCs_array2, epc_array[j]);
                                    }
                                }
                            }
                        }
                    }
                }
                return obj_to_return;
            } catch (err) {
                log.error({
                    title: "Error occured in IterateOverAggregationEvent_receiving",
                    details: err
                });
            }
        }

        function iterateOverAggregationEvent(epc_array, parent_ids, aggregationEvent, childEPCs_array, parent_analyzed) {
            try {
                var obj_to_return = [];
                if (epc_array === []) {
                    // Means that inside the case or bundle there are only single items therefore, return an array
                    // obj_to_return = childEPCs_array;
                    // log.debug({
                    //     title: "No children added, ends here",
                    //     details: childEPCs_array
                    // });
                } else {
                    if (aggregationEvent) {
                        for (let j in epc_array) {
                            for (let i in aggregationEvent) {
                                if (aggregationEvent[i].parentID["#text"] === epc_array[j]) {
                                    let index_i = i;
                                    let childEPCs = aggregationEvent[index_i].childEPCs;
                                    let childEPCs_array2 = [];
                                    if (childEPCs.epc.length) {
                                        for (let k in childEPCs.epc) {
                                            childEPCs_array2.push(childEPCs.epc[k]['#text']);
                                        }
                                    } else {
                                        childEPCs_array2.push(childEPCs.epc['#text']);
                                    }
                                    // log.debug({
                                    //     title: "parentID analyzed",
                                    //     details: epc_array[j]
                                    // });
                                    // log.debug({
                                    //     title: "childEPCs_array2",
                                    //     details: childEPCs_array2
                                    // });
                                    let is_epc_parent = isParent(childEPCs_array2, parent_ids);
                                    // log.debug({
                                    //     title: "is_epc_parent in second level BUNDLE",
                                    //     details: is_epc_parent.length
                                    // });
                                    if (is_epc_parent.length === 0) {
                                        if (typeof parent_analyzed !== undefined && parent_analyzed && parent_analyzed !== "") {
                                            let remaining_nonparent_items = listOfExcludedParentItems(epc_array[j], childEPCs_array);
                                            log.debug({
                                                title: "remaining_nonparent_items TI",
                                                details: remaining_nonparent_items
                                            });
                                            obj_to_return = {
                                                upper_parent: {
                                                    id: parent_analyzed,
                                                    single_items: remaining_nonparent_items,
                                                    parent_item: {
                                                        id: epc_array[j],
                                                        children_items: childEPCs_array2
                                                    }
                                                }
                                            }
                                        } else {
                                            obj_to_return = {
                                                parent_item: {
                                                    id: epc_array[j],
                                                    children_items: childEPCs_array2
                                                }
                                            }
                                        }
                                        if (!global_obj_items.some(obj => obj.parent_item.id === obj_to_return.parent_item.id || obj.upper_parent.id === obj_to_return.upper_parent.id)) {
                                            global_obj_items.push(obj_to_return);
                                        }
                                        // log.debug({
                                        //     title: "obj_to_return",
                                        //     details: obj_to_return
                                        // });
                                        global_obj_items_aux = global_obj_items;
                                        // log.audit({
                                        //     title: "searchResults",
                                        //     details: searchResults
                                        // });
                                    } else {
                                        iterateOverAggregationEvent(is_epc_parent, parent_ids, aggregationEvent, childEPCs_array2, epc_array[j]);
                                    }
                                }
                            }
                        }
                    }
                }
                return obj_to_return;
            } catch (err) {
                log.error({
                    title: "Error occured in IterateOverAggregationEvent",
                    details: err
                });
            }
        }
        function isParent(childEPCs_array, parent_ids) {
            try {
                let array_epc_parent = [];
                // Must return an array of the epc that are parents
                for (let k in childEPCs_array) {
                    if (parent_ids.includes(childEPCs_array[k])) {
                        // log.debug({
                        //     title: "Found an epc that is parent",
                        //     details: childEPCs_array[k]
                        // });
                        array_epc_parent.push(childEPCs_array[k]);
                    }
                }
                return array_epc_parent;
            } catch (err) {
                log.error({
                    title: "Error occurred in isParent",
                    details: err
                });
            }
        }

        function getAllParentsID(aggregationEvent) {
            try {
                let parents_id = [];
                // log.debug({
                //     title: "aggregationEvent length in getAllParentsID",
                //     details: aggregationEvent.length
                // });
                if (aggregationEvent.length) {
                    for (let i in aggregationEvent) {
                        parents_id.push(aggregationEvent[i].parentID['#text']);
                    }
                } else {
                    parents_id.push(aggregationEvent.parentID['#text']);
                }
                // log.emergency({
                //     title: "going to return",
                //     details: parents_id
                // });
                return parents_id;
            } catch (err) {
                log.error({
                    title: "Error occurred in getAllParentsID",
                    details: err
                });
                return '';
            }
        }
        /**
         * Defines the function that is executed when a DELETE request is sent to a RESTlet.
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters are passed as an Object (for all supported
                                        *     content types)
                                        * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
                                        *     Object when request Content-Type is 'application/json' or 'application/xml'
                                        * @since 2015.2
                                        */
        const doDelete = (requestParams) => {

        }

        return { get, put, post, delete: doDelete }

    });
