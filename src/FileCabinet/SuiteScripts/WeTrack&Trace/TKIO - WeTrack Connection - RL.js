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

        var file_id_uploaded = null;
        var epcis_is_correct = {
            success: false,
            record_id: '',
            message: ''
        }
        var CUSTOM_RECORD_ID_SUITETRACE_GRP = 'customrecord_tkio_suitetrace_grouping';
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
            log.audit({ title:'requestBody', details:requestBody });
            try {
                var scriptObj = runtime.getCurrentScript();
                var folderID = scriptObj.getParameter({ name: 'custscript_tkio_wetrack_epcis_folder_id' });
                if (folderID !== '') {
                    let gln = requestBody.gln;
                    if (!gln) {
                        throw "Missing 'gln' in JSON";
                    }
                    let validate_gln_result = validate_gln(gln);
                    log.debug({ title:'validate_gln_response', details:validate_gln_result });
                    if (validate_gln_result.success == false || !validate_gln_result.vendorId || !validate_gln_result.email_send) {
                        throw validate_gln_result.error;
                    }
                    let validate_folder_result = validate_folder(validate_gln_result.vendorName, gln, folderID);
                    log.debug({ title:'validate_folder_result', details:validate_folder_result });
                    if (validate_folder_result.success == false || !validate_folder_result.folderID) {
                        throw validate_folder_result.error;
                    }
                    let decoded = encode.convert({
                        string: requestBody.file_content,
                        inputEncoding: encode.Encoding.BASE_64,
                        outputEncoding: encode.Encoding.UTF_8
                    });
                    let fecha = new Date();
                    let dateStructure = fecha.getDate() + '-' + (fecha.getMonth()+1) + '-' + fecha.getFullYear() + '_' + fecha.toLocaleTimeString('en-US');
                    log.debug({ title:'dateStructure', details:dateStructure });
                    var fileObj = file.create({
                        name: 'EPCIS_' + gln + "_" + dateStructure + '.xml',
                        fileType: file.Type.XMLDOC,
                        contents: decoded
                    });
                    fileObj.folder = validate_folder_result.folderID;
                    file_id_uploaded = fileObj.save();
                    // TODO hacer la validacion antes de guardar el archivo.
                    let validaXML_response = validateXML(decoded);
                    if (validaXML_response.success == false) {
                        throw validaXML_response.message;
                    }
                    let make_suitetrace_grouping_registry_response = make_suitetrace_grouping_registry(file_id_uploaded, validate_gln_result.vendorId, validate_gln_result.email_send);
                    if (make_suitetrace_grouping_registry_response.success == false) {
                        throw make_suitetrace_grouping_registry_response.error;
                    }
                    epcis_is_correct.message ='Valid XML, the file has been saved. You will be notified of its status shortly.';
                    epcis_is_correct.record_id = make_suitetrace_grouping_registry_response.recordId;
                    epcis_is_correct.success = true;
                } else {
                    throw 'Folder ID not set, please contact support.'
                }
            } catch (err) {
                log.error({ title: 'Error occurred in post', details: err });
                epcis_is_correct.success = false;
                epcis_is_correct.record_id = '';
                epcis_is_correct.message = err;
            }
            log.audit({ title:'epcis_is_correct', details:epcis_is_correct });
            return JSON.stringify(epcis_is_correct)
        }

        function validate_gln(gln) {
            const response = {success: false, error: '', vendorName: '', vendorId: '', email_send: ''}
            try {
                // log.debug({ title:'gln', details:gln });
                const vendorSearchObj = search.create({
                    type: search.Type.VENDOR,
                    filters:
                    [
                       ["address.custrecord_tkio_gln_address", search.Operator.IS, gln]
                    ],
                    columns:
                    [
                        search.createColumn({
                            name: "internalid",
                            sort: search.Sort.ASC,
                            label: "Internal ID"
                        }),
                        search.createColumn({name: "entityid", label: "Name"}),
                        search.createColumn({name: "email", label: "Email"}),
                        search.createColumn({
                            name: "custrecord_tkio_gln_address",
                            join: "Address",
                            label: "GLN"
                        }),
                        search.createColumn({
                            name: "custrecord_tkio_suitetrace_email_loc",
                            join: "Address",
                            label: "SuiteTrace Email of Location"
                        })
                    ]
                });
                const myPagedData = vendorSearchObj.runPaged({
                    pageSize: 1000
                });
                // log.debug("Resultados de vendor",myPagedData.count);
                if (myPagedData.count > 0) {
                    if (myPagedData.count == 1) {
                        myPagedData.pageRanges.forEach(function(pageRange){
                            let myPage = myPagedData.fetch({index: pageRange.index});
                            myPage.data.forEach(function(result){
                                response.vendorId = result.getValue({name: 'internalid'});
                                response.vendorName = result.getValue({name: 'entityid'});
                                let email_location = result.getValue({
                                    name: "custrecord_tkio_suitetrace_email_loc",
                                    join: "Address",
                                    label: "SuiteTrace Email of Location"
                                });
                                let principal_email = result.getValue({name: 'email'});
                                if (email_location) {
                                    response.email_send = email_location;
                                }else{
                                    if (principal_email) {
                                        response.email_send = principal_email;
                                    }else{
                                        throw 'Email address not configured for GLN: '+gln+' on Netsuite, please contact support.';
                                    }
                                }
                            });
                        });
                        response.success = true;
                    }else{
                        throw 'More than one vendor with GLN: '+gln+' on Netsuite, please contact support.';
                    }
                }else{
                    throw 'GLN: '+gln+' not found on Netsuite, please contact support.';
                }
            } catch (error) {
                log.error({ title:'validate_gln', details:error });
                response.success = false;
                response.error = error;
            }
            return response;
        }

        function validate_folder(vendorName, gln, parentFolder) {
            const response = {success: false, error: '', folderID: ''}
            try {
                log.debug({ title:'params', details:{vendorName: vendorName, gln: gln, parentFolder: parentFolder} });
                let vendor_folder_result = search_folder(vendorName, parentFolder);
                log.debug({ title:'vendor_folder_result', details:vendor_folder_result });
                if (vendor_folder_result.success == false) {
                    throw vendor_folder_result.error;
                }
                let vendor_folder_id;
                if (vendor_folder_result.folderID == -1) { // crear vendorFolder
                    let create_vendor_folder = create_folder(vendorName, parentFolder);
                    log.debug({ title:'create_vendor_folder', details:create_vendor_folder });
                    if (create_vendor_folder.success == false) {
                        throw create_vendor_folder.error;
                    }
                    vendor_folder_id = create_vendor_folder.folderID;
                }else{ // ya existe el vendorFolder
                    vendor_folder_id = vendor_folder_result.folderID;
                }
                log.debug({ title:'vendor_folder_id', details:vendor_folder_id });
                let gln_folder_result = search_folder(gln, vendor_folder_id);
                log.debug({ title:'gln_folder_result', details:gln_folder_result });
                if (gln_folder_result.success == false) {
                    throw gln_folder_result.error;
                }
                let gln_folder_id;
                if (gln_folder_result.folderID == -1) { // crear glnFolder
                    let create_gln_folder = create_folder(gln, vendor_folder_id);
                    log.debug({ title:'create_gln_folder', details:create_gln_folder });
                    if (create_gln_folder.success == false) {
                        throw create_gln_folder.error;
                    }
                    gln_folder_id = create_gln_folder.folderID;
                }else{ // ya existe el glnFolder
                    gln_folder_id = gln_folder_result.folderID;
                }
                log.debug({ title:'gln_folder_id', details:gln_folder_id });
                if (gln_folder_id) {
                    response.folderID = gln_folder_id;
                }else{
                    response.folderID = parentFolder;
                }
                response.success = true;
            } catch (error) {
                log.error({ title:'validate_folder', details:error });
                response.success = false;
                response.error = error;
            }
            return response;
        }

        function search_folder(folderName, parentFolder) {
            const response = {success: false, error: '', folderID: -1}
            try {
                const folderSearchVendor = search.create({
                    type: search.Type.FOLDER,
                    filters:
                    [
                       ["parent", search.Operator.ANYOF, parentFolder],
                       "AND", 
                       ["name", search.Operator.IS, folderName]
                    ],
                    columns:
                    [
                        search.createColumn({
                            name: "internalid",
                            sort: search.Sort.ASC,
                            label: "Internal ID"
                        }),
                        search.createColumn({name: "name", label: "Name"}),
                        search.createColumn({name: "foldersize", label: "Size (KB)"}),
                        search.createColumn({name: "lastmodifieddate", label: "Last Modified"}),
                        search.createColumn({name: "parent", label: "Sub of"}),
                        search.createColumn({name: "numfiles", label: "# of Files"})
                    ]
                });
                const myPagedData = folderSearchVendor.runPaged({
                    pageSize: 1000
                });
                // log.debug("Resultados de folders",myPagedData.count);
                if (myPagedData.count > 0) { // obtener folder
                    myPagedData.pageRanges.forEach(function(pageRange){
                        let myPage = myPagedData.fetch({index: pageRange.index});
                        myPage.data.forEach(function(result){
                            response.folderID = result.getValue({name: 'internalid'});
                        });
                    });
                }
                response.success = true;
            } catch (error) {
                log.error({ title:'search_folder', details:error });
                response.success = false;
                response.error = error;
            }
            return response;
        }

        function create_folder(folderName, parentFolder) {
            const response = {success: false, error: '', folderID: -1}
            try {
                let objFolder = record.create({
                    type: record.Type.FOLDER,
                    isDynamic: true
                });

                objFolder.setValue({
                    fieldId: 'name',
                    value: folderName
                });
                objFolder.setValue({
                    fieldId: 'parent',
                    value: parentFolder
                });
                response.folderID = objFolder.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                response.success = true;
            } catch (error) {
                log.error({ title:'create_folder', details:error });
                response.success = false;
                response.error = error;
            }
            return response;
        }

        function make_suitetrace_grouping_registry(id_file, vendor_id, email_send) {
            const response = {success: false, error: '', recordId: ''}
            try {
                let obj_record = record.create({
                    type: CUSTOM_RECORD_ID_SUITETRACE_GRP,
                    isDynamic: true,
                });

                obj_record.setValue({
                    fieldId: 'custrecord_tkio_suitetrace_gr_file',
                    value: id_file
                });
                obj_record.setValue({
                    fieldId: 'custrecord_tkio_suitetrace_grp_gln',
                    value: vendor_id
                });
                obj_record.setValue({
                    fieldId: 'custrecord_tkio_suitetrace_grp_email',
                    value: email_send
                });
                let id_record = obj_record.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                response.success = true;
                response.recordId = id_record;
            } catch (err) {
                log.error({ title: 'Error occurred in make_suitetrace_grouping_registry', details: err });
                response.success = false;
                response.error = err;
            }
            return response
        }

        function validateXML(xml_body) {
            const response = {success: false, message: ''}
            try {
                var xmlDocument = xml.Parser.fromString({
                    text: xml_body
                });
                xml.validate({
                    xml: xmlDocument,
                    xsdFilePathOrId: 'SuiteBundles/Bundle 492865/EpcisFiles/epcisSchema.xsd',
                    importFolderPathOrId: 'SuiteBundles/Bundle 492865/EpcisFiles'
                });
                response.message = 'Valid XML';
                response.success = true;
            } catch (err) {
                log.error({
                    title: "Error ocurred in ValidateXML",
                    details: err
                });
                response.message = err;
                response.success = false;
            }
            return response;
        }
        
        const doDelete = (requestParams) => {

        }

        return { get, put, post, delete: doDelete }

    });
