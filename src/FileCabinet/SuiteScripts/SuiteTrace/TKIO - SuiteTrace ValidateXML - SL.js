/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/file', 'N/https', 'N/log', 'N/ui/serverWidget', 'N/xml', 'N/record', 'N/search'],
    /**
 * @param{file} file
 * @param{https} https
 * @param{log} log
 * @param{serverWidget} serverWidget
 * @param{xml} xml
 */
    (file, https, log, serverWidget, xml, record, search) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        var global_obj_items = [];
        var global_obj_items_aux = [];
        var global_obj_single_items = [];
        var global_obj = [];

        var global_obj_items_receiving = [];
        var global_obj_items_aux_receiving = [];
        var global_obj_single_items_receiving = [];
        var global_obj_receiving = [];
        var file_id_uploaded = null;
        var CUSTOM_RECORD_ID_EPCIS = 'customrecord_suitetrace_xml';
        var CUSTOM_RECORD_ID = 'customrecord_wetrack_transaction';
        var CUSTOM_SHIPMENT_CONTENT_RECORD_ID = 'customrecord_tkio_wetrack_shipment_cntnt';
        const onRequest = (scriptContext) => {
            try {
                let params = scriptContext.request.parameters;
                let response = scriptContext.response;
                // new_registry_track();
                // let data_EPCIS_uploads = searchEPCIS_uploads();
                // log.emergency({
                //     title: "Data EPCIS Uploads",
                //     details: data_EPCIS_uploads
                // });
                // get3Ts('54960').then(resp=>{

                //     log.debug({
                //         title: "resp_3ts",
                //         details: resp
                //     });
                // });
                if (scriptContext.request.method === 'POST') {
                    // Handle POST request
                    var requestBody = scriptContext.request.body;
                    log.debug({
                        title: "POST from VUE MedTracing",
                        details: requestBody
                    });
                    // 1. Valida que el XML esté como define el esquema EPCIS 1.2.
                    var isValidXML = validateXML(requestBody);
                    log.debug({
                        title: "isValidXML",
                        details: isValidXML
                    });
                    let date = Date.now();
                    var fileObj = file.create({
                        name: 'EPCIS-' + date + '.xml',
                        fileType: file.Type.XMLDOC,
                        contents: requestBody
                    });
                    fileObj.folder = 3682;
                    file_id_uploaded = fileObj.save();
                    log.debug({
                        title: "file_id_uploaded",
                        details: file_id_uploaded
                    });

                    // 2. Convierte de XML a JSON para inicar recorrido de validaciones de contenido
                    var obj_xml = getXMLJSON(requestBody);

                    // log.debug({
                    //     title: "obj_xml",
                    //     details: JSON.stringify(obj_xml)
                    // });
                    // 3. Realiza validaciones y mapeo de datos de contenido según DSCSA
                    var transactionInformationObj = getTransactionInformationSummary(JSON.stringify(obj_xml));
                    var transactionHistoryObj = getTransactionHistoryReloaded(JSON.stringify(obj_xml));
                    var transactionStatementObj = getTransactionStatement(JSON.stringify(obj_xml));
                    var get_transaction_items=transactionInformationObj.transactionEvent;
                    var get_pos_ti = transactionInformationObj.purchaseOrders;
                    get_items_info(get_transaction_items,'');
                    make_registry(get_pos_ti, file_id_uploaded);

                    // log.debug({
                    //     title: "transactionStatementObj",
                    //     details: transactionStatementObj
                    // });
                    // log.debug({
                    //     title: "TransactionHistoryObj NEW",
                    //     details: transactionHistoryObj
                    // });
                    // log.debug({
                    //     title: "TransactionHistoryObj NEW",
                    //     details: transactionHistoryObj[0].products_information
                    // });
                    // log.debug({
                    //     title: "TransactionHistoryObj NEW",
                    //     details: transactionHistoryObj[0].sender_info
                    // });
                    // log.debug({
                    //     title: "transactionInformationObj.transactionEvent",
                    //     details: transactionInformationObj.transactionEvent
                    // });
                    log.debug({
                        title: "transactionInformationObj",
                        details: transactionInformationObj.purchaseOrders
                    });
                    // Mandar respuesta de que todo está bien debe ser al final por si existe algo que debería ser obligatorio en la evaluación de contenido del archivo XML
                    if (isValidXML) {
                        scriptContext.response.write(JSON.stringify(obj_xml));
                    } else {
                        scriptContext.response.write('Error: invalid XML');
                    }
                    // Process the request body data as needed
                }
                if (scriptContext.request.method === 'GET') {
                    if (params.get3Ts) {
                        get3Ts(params.get3Ts).then((resp) => {
                            log.debug({
                                title: "resp in get3Ts request",
                                details: resp
                            });
                            response.write({
                                output: resp + ''
                            });
                        })
                    }
                    if (params.getEPCISUploads) {
                        let resp = searchEPCIS_uploads();
                        response.write({
                            output: resp
                        });
                    }
                }
                // else {
                //     // Handle other HTTP methods (GET, PUT, DELETE, etc.)
                //     // You can provide appropriate responses or redirect to a different page
                //     scriptContext.response.write('Invalid request method');
                // }
            } catch (err) {
                scriptContext.response.write("An error ocurred on validating the XML file:" + err);
                log.error({
                    title: "Error occured onRequest",
                    details: err
                });
            }
        }
        function get_items_info(items_hierarchy,product_information){
            try{
                log.emergency({
                    title: "items_hierarchy",
                    details: items_hierarchy
                })
            
            }catch(err){
            log.error({title:'Error occurred in get_items_info',details:err});
            }
        }
        function searchEPCIS_uploads() {
            try {
                let obj_to_return = [];
                const customrecord_tkio_wetrack_xmlSearchColId = search.createColumn({ name: 'id', sort: search.Sort.ASC });
                const customrecord_tkio_wetrack_xmlSearchColPurchaseOrders = search.createColumn({ name: 'custrecord_wetrack_xml_pos' });
                const customrecord_tkio_wetrack_xmlSearchColEpcisFile = search.createColumn({ name: 'custrecord_wetrack_xml_epcis' });
                const customrecord_tkio_wetrack_xmlSearchColIsSuspicious = search.createColumn({ name: 'custrecord_wetrack_xml_suspicious' });
                const customrecord_tkio_wetrack_xmlSearchColTransactionDate = search.createColumn({ name: 'custrecord_wetrack_xml_date' });

                const customrecord_tkio_wetrack_xmlSearch = search.create({
                    type: 'customrecord_suitetrace_xml',
                    filters: [],
                    columns: [
                        customrecord_tkio_wetrack_xmlSearchColId,
                        customrecord_tkio_wetrack_xmlSearchColPurchaseOrders,
                        customrecord_tkio_wetrack_xmlSearchColEpcisFile,
                        customrecord_tkio_wetrack_xmlSearchColIsSuspicious,
                        customrecord_tkio_wetrack_xmlSearchColTransactionDate
                    ],
                });

                const customrecord_tkio_wetrack_xmlSearchPagedData = customrecord_tkio_wetrack_xmlSearch.runPaged({ pageSize: 1000 });
                for (let i = 0; i < customrecord_tkio_wetrack_xmlSearchPagedData.pageRanges.length; i++) {
                    const customrecord_tkio_wetrack_xmlSearchPage = customrecord_tkio_wetrack_xmlSearchPagedData.fetch({ index: i });
                    customrecord_tkio_wetrack_xmlSearchPage.data.forEach((result) => {
                        const id = result.getValue(customrecord_tkio_wetrack_xmlSearchColId);
                        const purchaseOrders = result.getValue(customrecord_tkio_wetrack_xmlSearchColPurchaseOrders);
                        const epcisFile = result.getValue(customrecord_tkio_wetrack_xmlSearchColEpcisFile);
                        const isSuspicious = result.getValue(customrecord_tkio_wetrack_xmlSearchColIsSuspicious);
                        const transactionDate = result.getValue(customrecord_tkio_wetrack_xmlSearchColTransactionDate);

                        obj_to_return.push({
                            id: id,
                            purchaseOrders: purchaseOrders,
                            epcisFile: epcisFile,
                            isSuspicious: isSuspicious,
                            date: transactionDate,
                            three_ts: get3Ts(epcisFile)
                        });

                    });
                }
                // log.emergency({
                //     title: "obj,
                //     details: obj_to_return[0].three_ts.transaction_information.receiver_info
                // });

                return JSON.stringify(obj_to_return);
            } catch (err) {
                log.error({ title: 'Error occurred in searchEPCIS_uploads', details: err });
            }
        }
        function get3Ts(file_id) {
            try {
                var fileObj = file.load({
                    id: file_id
                });
                let obj_to_return = {
                    transaction_information: null,
                    transaction_history: null,
                    transaction_statement: null
                };
                let file_content_str = fileObj.getContents();
                var obj_xml = getXMLJSON(file_content_str);
                var transactionInformationObj = getTransactionInformationSummary(JSON.stringify(obj_xml));
                var transactionHistoryObj = getTransactionHistoryReloaded(JSON.stringify(obj_xml));
                var transactionStatementObj = getTransactionStatement(JSON.stringify(obj_xml));

                obj_to_return.transaction_information = transactionInformationObj;
                obj_to_return.transaction_history = transactionHistoryObj;
                obj_to_return.transaction_statement = transactionStatementObj;

                return obj_to_return;
            } catch (err) {
                log.error({ title: 'Error occurred in get3Ts', details: err });
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
                purchase_orders.forEach((po,index,arr) => {
                    if(index!==arr.length-1){
                        str_pos += po + ','
                    }else{
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
        async function new_registry_track() {
            try {
                let aux_record_id = '';
                let objRecord = record.create({
                    type: CUSTOM_RECORD_ID,
                    isDynamic: false,
                });
                // SETTING RECEIVING FIELDS
                objRecord.setValue({
                    fieldId: 'custrecord_wetrack_receiver_sgln',
                    value: 'urn:epc:id:sgln:039999.999929.0'
                });
                objRecord.setValue({
                    fieldId: 'custrecord_wetrack_receiver_sgln_loc',
                    value: 'urn:epc:id:sgln:039999.999925.0'
                });
                objRecord.setValue({
                    fieldId: 'custrecord_wetrack_receiver_company_name',
                    value: 'Healix Infusion Therapy'
                });
                objRecord.setValue({
                    fieldId: 'custrecord_wetrack_receiver_addr_one',
                    value: '211 La Ladera'
                });
                objRecord.setValue({
                    fieldId: 'custrecord_wetrack_receiver_addr_two',
                    value: '365 Eglinton'
                });
                objRecord.setValue({
                    fieldId: 'custrecord_wetrack_receiver_city',
                    value: 'Houston'
                });
                objRecord.setValue({
                    fieldId: 'custrecord_wetrack_receiver_state',
                    value: 'Texas'
                });
                objRecord.setValue({
                    fieldId: 'custrecord_wetrack_receiver_postal_code',
                    value: '76148'
                });
                objRecord.setValue({
                    fieldId: 'custrecord_receiver_country_code',
                    value: 'US'
                });
                // SETTING SENDER FIELDS
                objRecord.setValue({
                    fieldId: 'custrecord_wetrack_sgln_owningpty',
                    value: 'urn:epc:id:sgln:030001.111124.0'
                });
                objRecord.setValue({
                    fieldId: 'custrecord_wetrack_sgln_location',
                    value: 'urn:epc:id:sgln:030001.111123.0'
                });
                objRecord.setValue({
                    fieldId: 'custrecord_wetrack_name',
                    value: 'Tekiio'
                });
                objRecord.setValue({
                    fieldId: 'custrecord_wetrack_address_one',
                    value: 'Ladera del Cubilete 207'
                });
                objRecord.setValue({
                    fieldId: 'custrecord_wetrack_address_two',
                    value: ''
                });
                objRecord.setValue({
                    fieldId: 'custrecord_wetrack_city',
                    value: 'Querétaro'
                });
                objRecord.setValue({
                    fieldId: 'custrecord_wetrack_state',
                    value: 'Querétaro'
                });
                objRecord.setValue({
                    fieldId: 'custrecord_wetrack_postal_code',
                    value: '2832'
                });
                objRecord.setValue({
                    fieldId: 'custrecord_wetrack_country_code',
                    value: 'MX'
                });
                aux_record_id = objRecord.save();
                log.debug({
                    title: "aux_record_id",
                    details: aux_record_id
                })
                await register_shipment_content().then((res) => {
                    var objRecord2 = record.load({
                        type: CUSTOM_RECORD_ID,
                        id: aux_record_id,
                        isDynamic: true,
                    });
                    // SETTING SHIPMENT CONTENT FIELDS
                    objRecord2.setValue({
                        fieldId: 'custrecord_wetrack_shipment_ctnt_fields',
                        value: res
                    });
                    log.debug({
                        title: "res",
                        details: res
                    })

                    objRecord2.save();
                });




            } catch (err) {
                log.error({ title: 'Error occurred in new_registry_track', details: err });
            }
        }
        async function register_shipment_content() {
            try {
                let ids_shipment_content = [];

                for (let i = 0; i <= 2; i++) {
                    let objRecord3 = record.create({
                        type: CUSTOM_SHIPMENT_CONTENT_RECORD_ID,
                        isDynamic: false,
                    });
                    let id = '';
                    objRecord3.setValue({
                        fieldId: 'custrecord_tkio_wetrack_pack_type',
                        value: '3'
                    });
                    objRecord3.setValue({
                        fieldId: 'custrecord_tkio_wetrack_item',
                        value: 'urn:epc:id:sgtin:0355154.444444.4546158751311,urn:epc:id:sgtin:0355154.444444.1545451245454,urn:epc:id:sgtin:0355154.444444.12212121212121'
                    });
                    objRecord3.setValue({
                        fieldId: 'custrecord_wetrack_ndc',
                        value: '05515439449'
                    });
                    objRecord3.setValue({
                        fieldId: 'custrecord_wetrack_product_name',
                        value: 'Paracetamol'
                    });
                    objRecord3.setValue({
                        fieldId: 'custrecord_wetrack_manufacturer_of_trade',
                        value: 'Curascript'
                    });
                    objRecord3.setValue({
                        fieldId: 'custrecord_wetrack_dosage',
                        value: 'PILL'
                    });
                    objRecord3.setValue({
                        fieldId: 'custrecord_wetrack_strength',
                        value: '200mg'
                    });
                    objRecord3.setValue({
                        fieldId: 'custrecord_wetrack_net_content',
                        value: '100 pills'
                    });

                    id = objRecord3.save();
                    log.debug({
                        title: "objRecord3",
                        details: id
                    })
                    ids_shipment_content.push(id);

                }
                return ids_shipment_content;
            } catch (err) {
                log.error({ title: 'Error occurred in register_shipment_content', details: err });
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
                return true;
            } catch (err) {
                log.error({
                    title: "Error ocurred in ValidateXML",
                    details: err
                });
                return false;
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
                                                            var all_parentsID = getAllParentsID(jsonObj2.EPCISBody.EventList.AggregationEvent);
                                                            // log.debug({
                                                            //     title: "All parents ID",
                                                            //     details: all_parentsID
                                                            // });
                                                            for (let o in epc_array) {
                                                                item_isParent_receiving(epc_array[o], res.commissioning, all_parentsID, jsonObj2.EPCISBody.EventList.AggregationEvent);
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
                                                                log.emergency({
                                                                    title: "Ahhhhhh aqui anda pero ausilio",
                                                                    details: global_obj_receiving
                                                                });

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
                                                                                    var all_parentsID = getAllParentsID(jsonObj2.EPCISBody.EventList.AggregationEvent);
                                                                                    for (let o in epc_array) {
                                                                                        item_isParent_receiving(epc_array[o], res.commissioning, all_parentsID, jsonObj2.EPCISBody.EventList.AggregationEvent);
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
                                                                var all_parentsID = getAllParentsID(jsonObj2.EPCISBody.EventList.AggregationEvent);
                                                                for (let o in epc_array) {
                                                                    item_isParent_receiving(epc_array[o], res.commissioning, all_parentsID, jsonObj2.EPCISBody.EventList.AggregationEvent);
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
                                                    log.emergency({
                                                        title: "vocabularyElement[m] EPCClass",
                                                        details: vocabularyElement[m]
                                                    });
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
        function getTransactionHistorySummary(jsonObj) {

            // Transaction History will be extracted from RECEIVING events
            // There is no Transaction History when there are no receiving events => means the EPCIS file comes from a manufacturer
            // Consider 2 scenarios for a supplier submitting this document
            // 1. Supplier submitting the document is both manufacturer and distributor
            // 2. Supplier submitting the document is only manufacturer
            // 3. Supplier submitting the document is only distributor

            // Proposed solution:
            // 1. Get commmissionig event with all SGTINs and SSCC because either way they are the products that gonna be added to the supplychain
            // 2. Read all receiving events but rearrange them chronologically with eventTime

            // if there is no receiving event to create a Transaction History just use the shipping event as transaction History
            // Because it could count as Transaction History that the manufacturer (first step of the supply chain) ships this fresh drug out of the oven to a trading partner

            // Note: Receiving event contains information regarding where the supplier got the product
            // Receiving event is equivalent to a shipping event BUT only for describing the drug track
            try {
                // Make Res variable an array because you will need to keep track per transactions between distributors
                // Just consider that there could be multiple transactions between distributors til it arrived to Healix

                let res_to_return = [];
                let jsonObj2 = JSON.parse(jsonObj);

                let epcisBody = jsonObj2.EPCISBody;
                let receivingEvent = [];
                let shippingEvent = [];
                if (epcisBody) {
                    let eventList = jsonObj2.EPCISBody.EventList;
                    if (eventList) {
                        let objectEvent = jsonObj2.EPCISBody.EventList.ObjectEvent;
                        if (objectEvent) {
                            for (let k in objectEvent) {
                                let bizStep = objectEvent[k].bizStep['#text'];
                                let res = {
                                    eventTime: '',
                                    addresses: '',
                                    supplierId: '', //this is the supplier who is receiving the products
                                    distributorIdOfLocationOrigin: '',
                                    timeTransaction: '',
                                    supplierIdOfLocation: '',
                                    purchaseOrders: [],
                                    invoices: [],
                                    commissioning: [],
                                    purchaseOrders_nextStep: []
                                }
                                let auxSupplierIds = [];
                                if (bizStep.includes("receiving")) {
                                    // log.debug({
                                    //     title: "objectEvent[k].extension",
                                    //     details: objectEvent[k].extension
                                    // })
                                    if (objectEvent[k].bizLocation) {
                                        let bizLocation = objectEvent[k].bizLocation.id['#text'];
                                        // log.debug({
                                        //     title: "bizlocation",
                                        //     details: bizLocation
                                        // });
                                        res.supplierId = bizLocation;
                                        auxSupplierIds.push(bizLocation);
                                    }
                                    if (objectEvent[k].extension.sourceList) {
                                        let sourceListSource = objectEvent[k].extension.sourceList.source;
                                        for (let m in sourceListSource) {
                                            // SourceList is were it came from, meaning the distributor of the supplier
                                            if (sourceListSource[m]['#text']) {

                                                receivingEvent.push(objectEvent[k]);
                                                if (sourceListSource.length === 2) {
                                                    res.distributorIdOfLocationOrigin = sourceListSource[1]['#text'];
                                                } else {
                                                    res.distributorIdOfLocationOrigin = sourceListSource[0]['#text'];
                                                }

                                            } else {
                                                receivingEvent.push(objectEvent[k]);
                                                res.distributorIdOfLocationOrigin = sourceListSource['#text'];

                                            }
                                        }
                                    }
                                    if (objectEvent[k].eventTime) {
                                        let eventTimeShipment = objectEvent[k].eventTime['#text'];
                                        res.timeTransaction = eventTimeShipment;
                                    }
                                    let auxKindexOfSender = 0;
                                    // Get the id of the receiver Location to then get the full address in commissioning
                                    if (objectEvent[k].extension.destinationList) {
                                        let destinationListSource = objectEvent[k].extension.destinationList.destination;
                                        log.debug({
                                            title: "destinationListSource",
                                            details: destinationListSource
                                        });
                                        for (let n in destinationListSource) {
                                            log.debug({
                                                title: "destinationListSource[n]",
                                                details: destinationListSource[n]
                                            });
                                            if (destinationListSource[n]['#text']) {

                                                // if (destinationListSource[n]['#text'] === res.supplierId) {
                                                if (destinationListSource.length === 2) {
                                                    res.supplierIdOfLocation = destinationListSource[1]['#text'];
                                                } else {
                                                    res.supplierIdOfLocation = destinationListSource['#text'];
                                                }
                                                auxKindexOfSender = k;
                                                // }
                                            } else {
                                                log.debug({
                                                    title: "destinationListSource['#text']",
                                                    details: destinationListSource['#text']
                                                })
                                                // if (destinationListSource['#text'] === res.supplierId) {
                                                res.supplierIdOfLocation = destinationListSource['#text'];
                                                auxKindexOfSender = k;
                                                // }
                                            }
                                        }
                                    }
                                    // Get transactionList that has POs and possible Invoice
                                    log.debug({
                                        title: "objectEvent[auxKindexOfSender].bizTransactionList",
                                        details: objectEvent[auxKindexOfSender].bizTransactionList
                                    })
                                    log.debug({
                                        title: "auxKindexOfSender",
                                        details: auxKindexOfSender
                                    })
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
                                                        if (typebizTransactionList === "urn:epcglobal:cbv:btt:inv") {

                                                            res.invoices.push(bizTransactionList[g][h]['#text']);
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }


                                    res_to_return.push(res);
                                }


                                log.debug({
                                    title: "entra",
                                    details: bizStep
                                })
                                log.debug({
                                    title: "res",
                                    details: res
                                })

                            }

                            // get shipping events that are related to the Receiving Event
                            // Source ID/Supplier ID should be in sourceList of the Shipping Event.
                            // Get the source and next location to where it was shipped.
                            // iterate all over to avoid any problems rn, later you can improve all this code to make it more efficient
                            for (let k2 in objectEvent) {
                                let bizStep_auxiliary = objectEvent[k2].bizStep['#text'];
                                if (bizStep_auxiliary.includes('shipping')) {
                                    res_to_return.forEach(res => {
                                        if (objectEvent[k2].extension.sourceList) {
                                            let sourceListSource = objectEvent[k2].extension.sourceList.source;
                                            for (let m in sourceListSource) {
                                                if (sourceListSource[m]['#text']) {
                                                    if (sourceListSource[m]['#text'] === res.supplierId) {
                                                        shippingEvent.push(objectEvent[k2]);
                                                        if (sourceListSource.length === 2) {
                                                            res.senderIdOfLocationOrigin_nextStep = sourceListSource[1]['#text'];
                                                        } else {
                                                            res.senderIdOfLocationOrigin_nextStep = sourceListSource[0]['#text'];
                                                        }
                                                    }
                                                } else {
                                                    if (sourceListSource['#text'] === res.supplierId) {
                                                        shippingEvent.push(objectEvent[k2]);
                                                        res.senderIdOfLocationOrigin_nextStep = sourceListSource['#text']
                                                    }

                                                }
                                            }
                                        }
                                        if (objectEvent[k2].eventTime) {
                                            let eventTimeShipment = objectEvent[k2].eventTime['#text'];
                                            res.timeTransaction_nextStep = eventTimeShipment;
                                        }
                                        let auxKindexOfSender = 0;
                                        if (objectEvent[k2].extension.destinationList) {
                                            let destinationListSource = objectEvent[k2].extension.destinationList.destination;
                                            for (let n in destinationListSource) {
                                                if (destinationListSource[n]['#text']) {
                                                    if (destinationListSource.length === 2) {
                                                        res.receiverIdOfLocation_nextStep = destinationListSource[1]['#text'];
                                                    } else {
                                                        res.receiverIdOfLocation_nextStep = destinationListSource['#text'];
                                                    }
                                                    auxKindexOfSender = k2;

                                                } else {
                                                    res.receiverIdOfLocation_nextStep = destinationListSource['#text'];
                                                    auxKindexOfSender = k2;

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
                                                                res.purchaseOrders_nextStep.push(bizTransactionList[g][h]['#text']);
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    })


                                }
                            }






                            let lotNumbersAndExpirationDate = [];


                            for (let k in objectEvent) {
                                let bizStep = objectEvent[k].bizStep['#text'];

                                if (bizStep.includes('commissioning')) {
                                    log.debug({
                                        title: "entra2",
                                        details: true
                                    });

                                    res_to_return.forEach(res => {
                                        global_obj_receiving = [];

                                        if (objectEvent[k].bizLocation) {
                                            let bizLocation = objectEvent[k].bizLocation.id['#text'];
                                            log.debug({
                                                title: "bizLocation === res.supplierIdOfLocation",
                                                details: bizLocation === res.supplierIdOfLocation
                                            })
                                            log.debug({
                                                title: "bizLocation",
                                                details: bizLocation
                                            })
                                            log.debug({
                                                title: "res.supplierIdOfLocation",
                                                details: res.supplierIdOfLocation
                                            })
                                            if (bizLocation === res.supplierIdOfLocation) {

                                                log.debug({
                                                    title: "Commissioning of RECEIVING",
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
                                                else {
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
                                        let transactionEvent = jsonObj2.EPCISBody.EventList.TransactionEvent;
                                        if (transactionEvent) {
                                            for (let y in transactionEvent) {
                                                let eventTime_receiving = transactionEvent[y].eventTime;
                                                if (transactionEvent[y].bizTransactionList) {
                                                    log.debug({
                                                        title: "transactionEvent[y].bizTransactionList RECEIVING",
                                                        details: transactionEvent[y].bizTransactionList
                                                    });
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

                                                            for (let x in res.purchaseOrders_nextStep) {
                                                                if (bizTransaction_po === res.purchaseOrders_nextStep[x]) {
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
                                                                        var all_parentsID = getAllParentsID(jsonObj2.EPCISBody.EventList.AggregationEvent);
                                                                        log.debug({
                                                                            title: "All parents ID RECEIVING",
                                                                            details: all_parentsID
                                                                        });
                                                                        for (let o in epc_array) {
                                                                            item_isParent_receiving(epc_array[o], res.commissioning, all_parentsID, jsonObj2.EPCISBody.EventList.AggregationEvent);
                                                                            const array_only_upper_parent = global_obj_items_aux_receiving.filter(obj => obj.hasOwnProperty('upper_parent'));
                                                                            const array_without_upper_parent = global_obj_items_aux_receiving.filter(obj => !obj.hasOwnProperty('upper_parent'));
                                                                            log.debug({
                                                                                title: "array_only_upper_parent",
                                                                                details: array_only_upper_parent
                                                                            });
                                                                            log.debug({
                                                                                title: "array_without_upper_parent",
                                                                                details: array_without_upper_parent
                                                                            });
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
                                                                            log.audit({
                                                                                title: "resultArraY RECEIVING",
                                                                                details: resultArray
                                                                            });
                                                                            // mergedArray contains the structure well-formed of the cases,bundles and items without repeating ids,etc
                                                                            const mergedArray = array_without_upper_parent.concat(resultArray);
                                                                            global_obj_receiving.push({
                                                                                eventTime: eventTime_receiving,
                                                                                purchase_order: res.purchaseOrders[x],
                                                                                outermost: {
                                                                                    id: epc_array[o],
                                                                                    single_items: global_obj_single_items_receiving,
                                                                                    items_with_children: mergedArray
                                                                                }
                                                                            });
                                                                            global_obj_items_receiving = [];
                                                                            global_obj_items_aux_receiving = [];
                                                                            global_obj_single_items_receiving = [];
                                                                        }
                                                                    }

                                                                } else {
                                                                    //    when there is no Transaction Event, you should be using a Shipping

                                                                }
                                                                log.audit({
                                                                    title: "global_obj_receiving",
                                                                    details: global_obj_receiving
                                                                });
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        } else {
                                            log.debug({
                                                title: "ah",
                                                details: "not found"
                                            })
                                        }
                                        res.shipping_items_nextStep = global_obj_receiving;
                                    })
                                }
                            }
                        }
                    }
                } else {
                    log.error({
                        title: "EPCIS file error",
                        details: "EPCISBody not found"
                    });
                }

                return res_to_return;

            } catch (err) {
                log.error({
                    title: "Error occurred in getTransactionHistorySummary",
                    details: err
                });
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
                                                        var all_parentsID = getAllParentsID(jsonObj2.EPCISBody.EventList.AggregationEvent);
                                                        // log.debug({
                                                        //     title: "All parents ID",
                                                        //     details: all_parentsID
                                                        // });
                                                        for (let o in epc_array) {
                                                            item_isParent(epc_array[o], res.commissioning, all_parentsID, jsonObj2.EPCISBody.EventList.AggregationEvent);
                                                            const array_only_upper_parent = global_obj_items_aux.filter(obj => obj.hasOwnProperty('upper_parent'));
                                                            const array_without_upper_parent = global_obj_items_aux.filter(obj => !obj.hasOwnProperty('upper_parent'));
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
                                            var all_parentsID = getAllParentsID(jsonObj2.EPCISBody.EventList.AggregationEvent);
                                            for (let o in epc_array) {
                                                item_isParent(epc_array[o], res.commissioning, all_parentsID, jsonObj2.EPCISBody.EventList.AggregationEvent);
                                                const array_only_upper_parent = global_obj_items_aux.filter(obj => obj.hasOwnProperty('upper_parent'));
                                                const array_without_upper_parent = global_obj_items_aux.filter(obj => !obj.hasOwnProperty('upper_parent'));
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
                                                log.audit({
                                                    title: "resultArray",
                                                    details: resultArray
                                                });
                                                // mergedArray contains the structure well-formed of the cases,bundles and items without repeating ids,etc
                                                const mergedArray = array_without_upper_parent.concat(resultArray);
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
                                                log.emergency({
                                                    title: "vocabularyElement[m] EPCClass TI",
                                                    details: vocabularyElement[m]
                                                });
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
                            // log.debug({
                            //     title: "global_obj_items",
                            //     details: global_obj_items
                            // });
                            // NOTE: childEPCs_array is the whole list of content within the PO
                            // Now create a new list excluding the parent_items from childEPCs_array
                            let exclude_parent_items_from_childEPCs_array = listOfExcludedParentItems(global_obj_items, childEPCs_array);
                            // log.debug({
                            //     title: "exclude_parent_items_from_childEPCs_array",
                            //     details: exclude_parent_items_from_childEPCs_array
                            // });
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
                                arr_parent_items.push(obj_items[i].parent_item.id);
                            }
                        } else {
                            if (obj_items[i].upper_parent.id) {
                                arr_parent_items.push(obj_items[i].upper_parent.id);
                                if (obj_items[i].upper_parent.parent_item) {
                                    arr_parent_items.push(obj_items[i].upper_parent.parent_item.id);
                                }
                            } else {
                                arr_parent_items.push(obj_items[i].upper_parent.parent_item.id);
                            }
                        }
                    }
                } else {
                    log.audit({
                        title: "isArray",
                        details: false
                    })
                    arr_parent_items.push(obj_items);
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
                                            // log.debug({
                                            //     title: "PARENT",
                                            //     details: parent_analyzed.length
                                            // });
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
                                        global_obj_items_receiving.push(obj_to_return);
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
                                                title: "PARENT",
                                                details: parent_analyzed.length
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
                                        global_obj_items.push(obj_to_return);
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

        return { onRequest }

    });
