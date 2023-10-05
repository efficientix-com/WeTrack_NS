/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/log','N/https','N/url','N/ui/dialog'],

function(log,https,url,dialog) {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    var global_asn_not_valid=false;
    var type;
    function pageInit(scriptContext) {
        type=scriptContext.mode
    }

    function onASN_alert(){
        try{
            dialog.alert({
                title: "SuiteTrace ASN Configuration",
                message: "You cannot have more ASN configurations than your number of subsidiaries. Please edit the configurations of your subsidiaries."
            });
            global_asn_not_valid=true;
            
        }catch(err){
        console.error('Error occurred in onASN_alert',err);
        }
    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {

    }
    function onClickTestConnection(currentIdRecord){
        try{
            console.log('idRecord',currentIdRecord)
            var suiteletURL = url.resolveScript({
                scriptId: 'customscript_suitetrace_sftp_pwdguid_sl', // Replace with your Suitelet script ID
                deploymentId: 'customdeploy_suitetrace_sftp_pwdguid_sl', // Replace with your Suitelet deployment ID
                returnExternalUrl: false,
                params:{testConnection:true,currentIdRecord:currentIdRecord}
            });

            var domainName = url.resolveDomain({
                hostType: url.HostType.APPLICATION
            });
            var complete_url = 'https://' + domainName + suiteletURL


            // Make an HTTP request to the Suitelet URL
            var response = https.get({
                url: complete_url
            });
            if(response.code===200){
                console.log('response OK from suitelet');
                console.log('BODY:',response.body);
                dialog.alert({
                    title: "SuiteTrace SFTP Connection",
                    message: response.body.replace(/"/g,'')
                });
            }
        }catch(err){
        log.error({title:'Error occurred in onClickTestConnection',details:err});
        }
    }

    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    function postSourcing(scriptContext) {

    }

    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function sublistChanged(scriptContext) {

    }

    /**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function lineInit(scriptContext) {

    }

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {

    }

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateLine(scriptContext) {

    }

    /**
     * Validation function to be executed when sublist line is inserted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateInsert(scriptContext) {

    }

    /**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateDelete(scriptContext) {

    }

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {
        try{
            console.log("GET SAVE",global_asn_not_valid)
            if(global_asn_not_valid===true){
                dialog.alert({
                    title: "SuiteTrace ASN Configuration",
                    message: "Cannot add more than one configuration per Subsidiary"
                });
                return false
            }else{
                return true
            }
        }catch(err){
            dialog.alert({
                title: "SuiteTrace ASN Configuration",
                message: err
            });
        console.error('Error occurred in saveRecord',err);
        return false;
        }
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        postSourcing: postSourcing,
        sublistChanged: sublistChanged,
        lineInit: lineInit,
        validateField: validateField,
        validateLine: validateLine,
        validateInsert: validateInsert,
        validateDelete: validateDelete,
        saveRecord: saveRecord,
        onClickTestConnection:onClickTestConnection,
        onASN_alert:onASN_alert
    };
    
});
