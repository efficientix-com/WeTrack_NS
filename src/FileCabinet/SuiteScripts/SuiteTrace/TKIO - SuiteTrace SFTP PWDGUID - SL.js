/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/log', 'N/http', 'N/redirect', 'N/ui/serverWidget', 'N/record','N/sftp'],

    (log, http, redirect, serverWidget, record,sftp) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            var response = scriptContext.response;
            const request = scriptContext.request;
            let params = request.parameters;
            try {
                log.debug({
                    title: "params",
                    details: params
                });
                if (scriptContext.request.method === http.Method.GET) {
                    if (params.getPWD) {
                        // Handle GET request from User Event script
                        var record_actual = record.load({
                            type: 'customrecord_suitetrace_sftp_config',
                            id: params.idRecord
                        });
                        let fld_guid = record_actual.getValue({
                            fieldId: 'custrecord_suitetrace_sftp_guid'
                        });
                        let server_address = record_actual.getValue({
                            fieldId: 'custrecord_suitetrace_sftp_server'
                        })
                        if (fld_guid === '' || params.editMode === 'true') {

                            var form = serverWidget.createForm({
                                title: 'SuiteTrace SFTP Configuration',
                                hideNavBar: false
                            });
                            var fldCred = form.addCredentialField({
                                id: 'custpage_guid',
                                label: 'SFTP Password',
                                restrictToScriptIds: 'customscript_suitetrace_sftp_pwdguid_sl',
                                restrictToDomains: server_address,
                                restrictToCurrentUser: false
                            });
                            fldCred.isMandatory = true;
                            form.addSubmitButton();
                            response.writePage(form);
                        } else {
                            redirect.toRecord({
                                id: params.idRecord,
                                type: 'customrecord_suitetrace_sftp_config',
                                isEditMode: false,
                                parameters: { sendResponse: false }
                            });
                        }
                    } else if (params.testConnection) {
                        var testConnection_response = testConnection(params.currentIdRecord);
                        response.writeLine({
                            output: JSON.stringify(testConnection_response)
                        });
                    }


                } else {

                    let url_params_temp = params.entryformquerystring.split('idRecord=')[1];
                    let id_record = url_params_temp.split('&getPWD=')[0];
                    var pwd_guid = params.custpage_guid;
                    record.submitFields({
                        type: 'customrecord_suitetrace_sftp_config',
                        id: id_record,
                        values: {
                            custrecord_suitetrace_sftp_guid: pwd_guid
                        }
                    });
                    redirect.toRecord({
                        id: id_record,
                        type: 'customrecord_suitetrace_sftp_config',
                        isEditMode: false,
                        parameters: { sendResponse: true }
                    })
                }
            } catch (err) {
                log.error({ title: 'Error occurred in onRequest', details: err });
            }
        }
        function testConnection(idRecord) {
            try {
                var configRec = record.load({
                    type: 'customrecord_suitetrace_sftp_config',
                    id: idRecord
                });
        
                let suitetrace_sftpUser = configRec.getValue({
                    fieldId: 'custrecord_suitetrace_sftp_username'
                });
                let suitetrace_sftpGUID = configRec.getValue({
                    fieldId: 'custrecord_suitetrace_sftp_guid'
                });
                let suitetrace_sftpServer = configRec.getValue({
                    fieldId: 'custrecord_suitetrace_sftp_server'
                });
                let suitetrace_portNbr = configRec.getValue({
                    fieldId: 'custrecord_suitetrace_sftp_port'
                });
                let suitetrace_hostKey = configRec.getValue({
                    fieldId: 'custrecord_suitetrace_sftp_hostkey'
                });
                let suitetrace_sftpDir = configRec.getValue({
                    fieldId: 'custrecord_suitetrace_sftp_output_fd'
                });
                log.debug({
                    title: "SFTP record data",
                    details: suitetrace_sftpUser+', '+suitetrace_sftpGUID+', '+suitetrace_sftpServer+', '+suitetrace_portNbr+', '+suitetrace_hostKey+', '+suitetrace_sftpDir
                })
                var connection = sftp.createConnection({
                    username: suitetrace_sftpUser,
                    passwordGuid: suitetrace_sftpGUID,
                    url: suitetrace_sftpServer,
                    port: parseInt(suitetrace_portNbr),
                    directory: suitetrace_sftpDir,
                    hostKey: suitetrace_hostKey
                });
                if(connection){
                    return 'Connection was successful to server:'+suitetrace_sftpServer
                }else{
                    return 'Connection failed. Please verify credentials'
                }
            } catch (err) {
                log.error({ title: 'Error occurred in testConnection', details: err });
                return 'Connection failed. Please verify credentials'

            }
        }

        return { onRequest }

    });
