/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/url', 'N/log', 'N/https', 'N/redirect', 'N/ui/serverWidget'],

    (url, log, https, redirect, serverWidget) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
            try {
                const recCurrent = scriptContext.newRecord;
                const objForm = scriptContext.form;
                const sftp_guid_fld = recCurrent.getValue({
                    fieldId: 'custrecord_suitetrace_sftp_guid'
                });
                const id_record = recCurrent.getValue({
                    fieldId: 'recordid'
                });
                log.debug({
                    title: "CURRENT RECORD BEFORELOAD",
                    details: id_record
                })
                if (sftp_guid_fld !== '' && scriptContext.type !== scriptContext.UserEventType.EDIT) {
                    objForm.addButton({
                        id: "custpage_test_connection_sftp",
                        label: "Test Connection",
                        functionName: 'onClickTestConnection(' + id_record + ')'
                    });
                    objForm.clientScriptModulePath = './TKIO - SuiteTrace SFTP manage buttons - CL.js';

                    var html_fld = objForm.addField({
                        id: "custpage_html",
                        label: "html",
                        type: serverWidget.FieldType.INLINEHTML,
                    });
                    html_fld.defaultValue = `<script>
                    document.getElementById("custpage_test_connection_sftp").style.setProperty('color', 'white', 'important');
                    document.getElementById("custpage_test_connection_sftp").style.setProperty('background-color', '#42d078', 'important');
                    document.getElementById("custpage_test_connection_sftp").style.setProperty('border', '1px solid #42d078', 'important');
                    document.getElementById("tdbody_custpage_test_connection_sftp").style.setProperty('border', '1px solid #42d078', 'important');
                    document.getElementById("tdbody_custpage_test_connection_sftp").style.setProperty('border-radius', '3px', 'important');
                    document.getElementById("tdbody_custpage_test_connection_sftp").style.setProperty('box-shadow', '-1px 3px 20px -3px rgba(0,0,0,0.20)', 'important');
                    </script>`;
                    html_fld.defaultValue += '<script>';
                    html_fld.defaultValue += 'console.log("User event is being triggered");';
                    html_fld.defaultValue += `var listener4Events=document.querySelectorAll('.uir-header-buttons [id^="custpage"]');`;
                    html_fld.defaultValue += "for(var i=0;i<listener4Events.length;i++){"

                    html_fld.defaultValue += 'listener4Events[i].addEventListener("click", ()=>{';

                    html_fld.defaultValue += 'var mascaraDialog=document.getElementsByTagName("body")[0];'
                    html_fld.defaultValue += 'function cargarEstiloDialog(mutations){'
                    html_fld.defaultValue += 'for(let mutationD of mutations){'
                    html_fld.defaultValue += 'if(mutationD.type==="childList"){'
                    html_fld.defaultValue += 'var addedNodeD= mutationD.addedNodes;'
                    html_fld.defaultValue += 'console.log("Detectado de cambios",addedNodeD);'
                    html_fld.defaultValue += 'for(var i=0;i<addedNodeD.length;i++){'

                    html_fld.defaultValue += 'var addedNodeClassNameD= addedNodeD[i].className;'
                    html_fld.defaultValue += 'console.log("ClassName",addedNodeClassNameD);'
                    html_fld.defaultValue += 'if(addedNodeClassNameD=="x-window x-layer x-window-default x-border-box x-focus x-window-focus x-window-default-focus"){'

                    html_fld.defaultValue += 'console.log("Dialog was triggered");'

                    // Código de renderización de dialog
                    html_fld.defaultValue += `var dialog=document.querySelector('[role="dialog"] .uir-message-header');`;
                    html_fld.defaultValue += "if(dialog){"
                    html_fld.defaultValue += `var dialogHeader=document.querySelector('[role="dialog"] .x-window-header-title-default');`;
                    html_fld.defaultValue += `var dialogAll=document.querySelector('[role="dialog"].x-window-default');`;
                    html_fld.defaultValue += `var dialogButton=document.querySelector('[role="dialog"] .uir-message-buttons button');`;
                    html_fld.defaultValue += 'dialog.classList.remove("x-window-header-default");';
                    html_fld.defaultValue += `dialog.style.backgroundColor='white';`;
                    html_fld.defaultValue += "dialog.style.borderTop='10px solid #0077be';"
                    html_fld.defaultValue += "dialog.style.borderRadius='3px';"

                    html_fld.defaultValue += `dialogHeader.style.color='#0077be';`;


                    html_fld.defaultValue += `dialogButton.style.backgroundColor='#0077be';`;
                    html_fld.defaultValue += `dialogButton.style.color='white';`;
                    html_fld.defaultValue += "dialogButton.style.border='2px solid #0077be';"

                    html_fld.defaultValue += "dialogAll.style.borderRadius='3px';"

                    html_fld.defaultValue += "}"
                    // Fin de código de renderización de dialog

                    html_fld.defaultValue += '}'
                    html_fld.defaultValue += '}'
                    html_fld.defaultValue += '}'
                    html_fld.defaultValue += '}'
                    html_fld.defaultValue += '}'
                    html_fld.defaultValue += 'var observadorD=new MutationObserver(cargarEstiloDialog);'

                    html_fld.defaultValue += 'observadorD.observe(mascaraDialog,{childList: true});'
                    html_fld.defaultValue += '});';
                    html_fld.defaultValue += '}';

                    html_fld.defaultValue += '</script>';
                }
                let response_params = scriptContext.request.parameters;
                log.debug({
                    title: "RESPONSE PARAMS",
                    details: response_params
                })
            } catch (err) {
                log.error({ title: 'Error occurred in beforeLoad', details: err });
            }
        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            try {

                if (scriptContext.type === scriptContext.UserEventType.CREATE || scriptContext.type === scriptContext.UserEventType.EDIT) {
                    // Determine the Suitelet URL
                    var suiteletURL = url.resolveScript({
                        scriptId: 'customscript_suitetrace_sftp_pwdguid_sl', // Replace with your Suitelet script ID
                        deploymentId: 'customdeploy_suitetrace_sftp_pwdguid_sl', // Replace with your Suitelet deployment ID
                        returnExternalUrl: false,
                    });

                    var domainName = url.resolveDomain({
                        hostType: url.HostType.APPLICATION
                    });
                    var complete_url = 'https://' + domainName + suiteletURL


                    // Make an HTTP request to the Suitelet URL
                    var response = https.get({
                        url: complete_url
                    });
                    log.debug({
                        title: "response",
                        details: response
                    })
                    if (response.code === 200) {
                        if (scriptContext.type === scriptContext.UserEventType.EDIT) {

                            redirect.toSuitelet({
                                scriptId: "customscript_suitetrace_sftp_pwdguid_sl",
                                deploymentId: "customdeploy_suitetrace_sftp_pwdguid_sl",
                                isExternal: false,
                                parameters: { getPWD: true, idRecord: scriptContext.newRecord.id, editMode: true }
                            });
                        } else {
                            redirect.toSuitelet({
                                scriptId: "customscript_suitetrace_sftp_pwdguid_sl",
                                deploymentId: "customdeploy_suitetrace_sftp_pwdguid_sl",
                                isExternal: false,
                                parameters: { getPWD: true, idRecord: scriptContext.newRecord.id, editMode: false }
                            });
                        }
                    } else {
                        log.debug({
                            title: "Entered error on response",
                            details: "true"
                        })
                    }
                }

            } catch (err) {
                log.error({ title: 'Error occurred in afterSubmit', details: err });
            }
        }


        return { beforeLoad, beforeSubmit, afterSubmit }

    });
