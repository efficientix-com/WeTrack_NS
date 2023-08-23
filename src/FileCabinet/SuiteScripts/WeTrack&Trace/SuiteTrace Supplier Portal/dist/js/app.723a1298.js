(function(){"use strict";var __webpack_modules__={8279:function(t,e,a){a.d(e,{Z:function(){return m}});var s=function(){var t=this,e=t._self._c;return e("div",{attrs:{id:"DataTableReports"}},[e("table",{staticClass:"table mt-3",attrs:{id:"datatableComp"}}),e("b-modal",{ref:"modal_transaction_details",attrs:{size:"xl","hide-footer":"",scrollable:""},on:{hidden:t.hideModal},scopedSlots:t._u([{key:"modal-header",fn:function({close:a}){return[e("h5",[t._v("Transaction Exchange Details")]),e("div"),e("div",{staticClass:"close",attrs:{size:"sm"},on:{click:function(t){return a()}}},[e("font-awesome-icon",{attrs:{icon:"fa-solid fa-x",size:"1x"}})],1)]}}])},[e("div",[e("p",{staticClass:"blue-text mt-0 headline"},[e("strong",[t._v("Transaction Statement")])]),e("b-row",[e("b-col",[e("p",{staticClass:"mb-0 blue-text"},[t._v("Legal Notice")]),e("p",{staticClass:"mt-0"},[t._v(" "+t._s(t.transaction_statement)+" ")])])],1),e("p",{staticClass:"blue-text mt-0 headline"},[e("strong",[t._v("Transaction information")])]),e("div",{staticClass:"row"},[e("div",{staticClass:"col"},[e("p",{staticClass:"mb-0 blue-text"},[t._v("Sender Company Name")]),e("p",{staticClass:"mt-0"},[t._v(" "+t._s(t.transaction_information.sender_name)+" ")])]),e("div",{staticClass:"col"},[e("p",{staticClass:"mb-0 blue-text"},[t._v("Sender SGLN")]),e("p",{staticClass:"mt-0"},[t._v(" "+t._s(t.transaction_information.sender_SGLN)+" ")])])]),e("div",{staticClass:"row"},[e("div",{staticClass:"col"},[e("p",{staticClass:"mb-0 blue-text"},[t._v("Sender Owning Party Location")]),e("p",{staticClass:"mt-0"},[t._v(" "+t._s(t.transaction_information.sender_location_name)+" ")])]),e("div",{staticClass:"col"},[e("p",{staticClass:"mb-0 blue-text"},[t._v("Receiver Location Name")]),e("p",{staticClass:"mt-0"},[t._v(" "+t._s(t.transaction_information.receiver_location_name)+" ")])])]),e("div",{staticClass:"row"},[e("div",{staticClass:"col"},[e("p",{staticClass:"mb-0 blue-text"},[t._v("From Business")]),e("p",{staticClass:"mt-0"},[t._v(" "+t._s(t.transaction_information.sender_location_address)+" ")])]),e("div",{staticClass:"col"},[e("p",{staticClass:"mb-0 blue-text"},[t._v("To Business")]),e("p",{staticClass:"mt-0"},[t._v(" "+t._s(t.transaction_information.receiver_location_address)+" ")])])]),e("div",{staticClass:"row"},[e("div",{staticClass:"col"},[e("p",{staticClass:"mb-0 blue-text"},[t._v("Shipment Date")]),e("p",{staticClass:"mt-0"},[t._v(" "+t._s(t.transaction_information.shipment_date)+" ")])]),e("div",{staticClass:"col"},[e("p",{staticClass:"mb-0 blue-text"},[t._v("Purchase Orders")]),e("p",{staticClass:"mt-0"},[t._v(" "+t._s(t.transaction_information.purchase_orders)+" ")])])]),e("div")],1),e("div",{staticClass:"row"},[e("div",{staticClass:"col"},[e("p",{staticClass:"blue-text headline",staticStyle:{"font-weight":"600"}},[t._v(" "+t._s(t.data_purchase_orders.purchase_orders)+" ")])])]),e("div",{staticClass:"row"},[e("div",{staticClass:"col"},[e("table",{staticClass:"table mt-3 px-2",attrs:{id:t.data_purchase_orders.purchase_order_id}})])])]),e("b-modal",{ref:"modal_pack",attrs:{size:"xl","hide-footer":"",scrollable:""},on:{hidden:t.hideModal_pack},scopedSlots:t._u([{key:"modal-header",fn:function({close:a}){return[e("h5",[t._v("Packaging")]),e("div",{staticClass:"close",attrs:{size:"sm"},on:{click:function(t){return a()}}},[e("font-awesome-icon",{attrs:{icon:"fa-solid fa-x",size:"1x"}})],1)]}}])},[e("div",[e("b-row",{staticClass:"d-flex justify-content-center"},[""!==t.modal_pack_item_info.level_1?e("b-col",{attrs:{md:"3"}},[e("img",{attrs:{width:"200px",src:"https://firebasestorage.googleapis.com/v0/b/bloona-55051.appspot.com/o/PackImage.png?alt=media&token=8afe3df6-0819-45b2-99a8-972065a83d07",alt:"Package"}}),e("p",{staticStyle:{"text-align":"center","margin-bottom":"0px !important"}},[t._v(" SSCC/SGTIN: "+t._s(t.modal_pack_item_info.level_1)+" ")]),e("p",{staticClass:"blue-text",staticStyle:{"text-align":"center"}},[t._v("Level 1")])]):t._e(),""!==t.modal_pack_item_info.level_2?e("b-col",{attrs:{md:"3"}},[e("img",{attrs:{width:"200px",src:"https://firebasestorage.googleapis.com/v0/b/bloona-55051.appspot.com/o/PackImage.png?alt=media&token=8afe3df6-0819-45b2-99a8-972065a83d07",alt:"Package"}}),e("p",{staticStyle:{"text-align":"center","margin-bottom":"0px !important"}},[t._v(" SGTIN: "+t._s(t.modal_pack_item_info.level_2)+" ")]),e("p",{staticClass:"blue-text",staticStyle:{"text-align":"center"}},[t._v("Level 2")])]):t._e(),""!==t.modal_pack_item_info.level_3?e("b-col",{attrs:{md:"3"}},[e("img",{attrs:{width:"200px",src:"https://firebasestorage.googleapis.com/v0/b/bloona-55051.appspot.com/o/PackImage.png?alt=media&token=8afe3df6-0819-45b2-99a8-972065a83d07",alt:"Package"}}),e("p",{staticStyle:{"text-align":"center","margin-bottom":"0px !important"}},[t._v(" SGTIN: "+t._s(t.modal_pack_item_info.level_3)+" ")]),e("p",{staticClass:"blue-text",staticStyle:{"text-align":"center"}},[t._v("Level 3")])]):t._e(),""!==t.modal_pack_item_info.sgtin?e("b-col",{attrs:{md:"3"}},[e("img",{attrs:{width:"200px",src:"https://firebasestorage.googleapis.com/v0/b/bloona-55051.appspot.com/o/PackItemImage.png?alt=media&token=022af416-b315-4a43-ad9f-32810dbf1ab9",alt:"item"}}),e("p",{staticStyle:{"text-align":"center","margin-bottom":"0px !important"}},[t._v(" SGTIN:"+t._s(t.modal_pack_item_info.sgtin)+" ")]),e("p",{staticClass:"blue-text",staticStyle:{"text-align":"center"}},[t._v("Item")])]):t._e()],1)],1)]),e("b-modal",{ref:"modal_th",attrs:{size:"xl","hide-footer":"",scrollable:""},on:{hidden:t.hideModal_th},scopedSlots:t._u([{key:"modal-header",fn:function({close:a}){return[e("h5",[t._v("Transaction History of Item")]),e("div",{staticClass:"close",attrs:{size:"sm"},on:{click:function(t){return a()}}},[e("font-awesome-icon",{attrs:{icon:"fa-solid fa-x",size:"1x"}})],1)]}}])},[e("div",[e("b-row",[e("b-col",{staticStyle:{"background-color":"#077cab",width:"10px !important",padding:"0px !important"},attrs:{md:"1"}}),e("b-col",t._l(t.modal_th_item_info,(function(a){return e("b-row",{key:a.id,staticStyle:{"background-color":"#ededed","margin-bottom":"20px","border-radius":"3px solid #ededed"}},[e("b-col",{staticClass:"d-flex justify-content-center align-items-center",staticStyle:{width:"14px !important","background-color":"white !important",padding:"0px !important"},attrs:{md:"1"}},[e("font-awesome-icon",{staticStyle:{color:"#077cab","font-size":"1.3rem"},attrs:{icon:"fa-solid fa-caret-right"}})],1),e("b-col",[e("b-row",[e("b-col",[e("p",{staticClass:"mb-0 blue-text"},[t._v("Sender Name (SGLN)")]),e("p",{staticClass:"mt-0"},[t._v(" "+t._s(a.sender_name)+" ("+t._s(a.sender_SGLN)+") ")])]),e("b-col",[e("p",{staticClass:"mb-0 blue-text"},[t._v("Receiver Name (SGLN)")]),e("p",{staticClass:"mt-0"},[t._v(" "+t._s(a.receiver_name)+" ("+t._s(a.receiver_SGLN)+") ")])])],1),e("b-row",[e("b-col",[e("p",{staticClass:"mb-0 blue-text"},[t._v("Sender Address")]),e("p",{staticClass:"mt-0"},[t._v(" "+t._s(a.sender_street_addr1)+", "+t._s(a.sender_street_addr2)+", "+t._s(a.sender_postalCode)+", "+t._s(a.sender_city)+", "+t._s(a.sender_state)+", "+t._s(a.sender_countryCode)+". ")])]),e("b-col",[e("p",{staticClass:"mb-0 blue-text"},[t._v("Receiver Address")]),e("p",{staticClass:"mt-0"},[t._v(" "+t._s(a.receiver_street_addr1)+", "+t._s(a.receiver_street_addr2)+", "+t._s(a.receiver_postalCode)+", "+t._s(a.receiver_city)+", "+t._s(a.receiver_state)+", "+t._s(a.receiver_countryCode)+". ")])])],1),e("b-row",[e("b-col",[e("p",{staticClass:"mb-0 blue-text"},[t._v("From Location")]),e("p",{staticClass:"mt-0"},[t._v(" "+t._s(a.sender_loc_street_addr1)+", "+t._s(a.sender_loc_street_addr2)+", "+t._s(a.sender_loc_postalCode)+", "+t._s(a.sender_loc_city)+", "+t._s(a.sender_loc_state)+", "+t._s(a.sender_loc_countryCode)+". ")])]),e("b-col",[e("p",{staticClass:"mb-0 blue-text"},[t._v("To Location")]),e("p",{staticClass:"mt-0"},[t._v(" "+t._s(a.receiver_loc_street_addr1)+", "+t._s(a.receiver_loc_street_addr2)+", "+t._s(a.receiver_loc_postalCode)+", "+t._s(a.receiver_loc_city)+", "+t._s(a.receiver_loc_state)+", "+t._s(a.receiver_loc_countryCode)+". ")])])],1),e("b-row",[e("b-col",[e("p",{staticClass:"mb-0 blue-text"},[t._v("Purchase Orders")]),e("p",{staticClass:"mt-0"},[t._v(" "+t._s(a.purchase_orders_th)+" ")])]),e("b-col",[e("p",{staticClass:"mb-0 blue-text"},[t._v("Shipment Date")]),e("p",{staticClass:"mt-0"},[t._v(" "+t._s(a.shipment_date)+" ")])])],1)],1)],1)})),1)],1)],1)]),e("b-modal",{ref:"modal_suspect",attrs:{size:"xl","hide-footer":"",scrollable:""},on:{hidden:t.hideModal_suspect},scopedSlots:t._u([{key:"modal-header",fn:function({close:a}){return[e("h5",[t._v("Mark Item As Suspicious")]),e("div",{staticClass:"close",attrs:{size:"sm"},on:{click:function(t){return a()}}},[e("font-awesome-icon",{attrs:{icon:"fa-solid fa-x",size:"1x"}})],1)]}}])},[e("div",[e("b-row",[e("b-col",[e("b-form",{on:{submit:t.submitForm}},[e("b-row",[e("b-col",[e("b-form-group",{staticClass:"blue-text",attrs:{label:"Serial Number:","label-for":"serialNumber"}},[e("b-form-input",{attrs:{id:"serialNumber",required:"",placeholder:"Enter Serial Number"},model:{value:t.serialNumber,callback:function(e){t.serialNumber=e},expression:"serialNumber"}})],1)],1),e("b-col",[e("b-form-group",{staticClass:"blue-text",attrs:{label:"Item NDC:","label-for":"item_ndc"}},[e("b-form-input",{attrs:{id:"item_ndc",required:"",placeholder:"Enter Item NDC",disabled:""},model:{value:t.item_ndc,callback:function(e){t.item_ndc=e},expression:"item_ndc"}})],1)],1)],1),e("b-row",[e("b-col",[e("b-form-group",{staticClass:"blue-text",attrs:{label:"Lot Number:","label-for":"lot_number"}},[e("b-form-input",{attrs:{id:"lot_number",required:"",placeholder:"Enter Lot Number",disabled:""},model:{value:t.lot_number,callback:function(e){t.lot_number=e},expression:"lot_number"}})],1)],1),e("b-col",[e("b-form-group",{staticClass:"blue-text",attrs:{label:"Quantity:","label-for":"quantity"}},[e("b-form-input",{attrs:{id:"quantity",required:"",placeholder:"Enter quantity",disabled:""},model:{value:t.quantity,callback:function(e){t.quantity=e},expression:"quantity"}})],1)],1)],1),e("b-form-group",{staticClass:"blue-text",attrs:{label:"Reason:","label-for":"reason"}},[e("b-form-textarea",{attrs:{id:"reason",rows:"5",required:"",placeholder:"Enter Reason"},model:{value:t.reason,callback:function(e){t.reason=e},expression:"reason"}})],1),e("b-button",{staticStyle:{"background-color":"#077cab !important","border-radius":"3px !important","margin-top":"10px !important"},attrs:{type:"submit"}},[t._v("Submit")])],1)],1)],1)],1)]),e("b-modal",{ref:"modal_internal_movements",attrs:{size:"xl","hide-footer":"",scrollable:""},on:{hidden:t.hideModal_internal_movements},scopedSlots:t._u([{key:"modal-header",fn:function({close:a}){return[e("h5",[t._v("Internal Movements")]),e("div",{staticClass:"close",attrs:{size:"sm"},on:{click:function(t){return a()}}},[e("font-awesome-icon",{attrs:{icon:"fa-solid fa-x",size:"1x"}})],1)]}}])},[e("div",[e("small",[t._v("Displays the internal movements of the items related to the items described in the EPCIS file.")])]),e("div",{staticClass:"row"},[e("div",{staticClass:"col"},[e("p",{staticClass:"blue-text headline",staticStyle:{"font-weight":"600"}},[t._v(" "+t._s(t.data_purchase_orders.purchase_orders)+" ")])])]),e("div",{staticClass:"row"},[e("div",{staticClass:"col"},[e("table",{staticClass:"table mt-3 px-2",attrs:{id:t.data_purchase_orders.purchase_order_id}})])])]),e("b-modal",{ref:"modal_internal_movements_lot",attrs:{size:"xl","hide-footer":"",scrollable:""},on:{hidden:t.hideModal_internal_movements_lot},scopedSlots:t._u([{key:"modal-header",fn:function({close:a}){return[e("h5",[t._v("Item Internal Movements")]),e("div",{staticClass:"close",attrs:{size:"sm"},on:{click:function(t){return a()}}},[e("font-awesome-icon",{attrs:{icon:"fa-solid fa-x",size:"1x"}})],1)]}}])},[t.datatable_allRecordTypes_perItem.length>0?e("div",t._l(t.datatable_allRecordTypes_perItem,(function(a){return e("div",{key:a.id,staticClass:"row mt-4 headline"},[e("div",{staticClass:"row mt-2"},["Item Receipt"===a.recordtype?e("div",{staticClass:"col text-center"},[e("strong",[t._v(t._s(a.sender_name)+" "),e("font-awesome-icon",{attrs:{icon:"fa-solid fa-arrow-right",size:"1x"}}),t._v(" "+t._s(a.receiver_name))],1)]):"inventoryadjustment"===a.recordtype?e("div",{staticClass:"col text-center"},[e("strong",[t._v(t._s(a.subsidiary)+" ("+t._s(a.location)+")")])]):e("div",{staticClass:"col text-center"},[e("strong",[t._v(t._s(a.subsidiary)+" ("+t._s(a.location)+") "),e("font-awesome-icon",{attrs:{icon:"fa-solid fa-arrow-right",size:"1x"}}),t._v(" "+t._s(a.vendor))],1)])]),e("div",[e("div",{staticClass:"cheto"},[t._v(" "+t._s("Item Receipt"===a.recordtype?"Receipt":"inventoryadjustment"===a.recordtype?"Inventory Adjustment":"itemfulfillment"===a.recordtype?"Item fulfillment":"")+" ")])]),e("div",{staticClass:"row"},[e("div",{staticClass:"col"},[e("p",{staticClass:"mb-0 blue-text"},[t._v("Transaction date")]),e("p",{staticClass:"mt-0"},[t._v(t._s(a.trandate))])]),e("div",{staticClass:"col"},[e("p",{staticClass:"mb-0 blue-text"},[t._v("Quantity")]),e("p",{staticClass:"mt-0"},[t._v(t._s(a.quantity))])])]),"inventoryadjustment"===a.recordtype?e("div",{staticClass:"row"},[e("div",{staticClass:"col"},[e("p",{staticClass:"mb-0 blue-text"},[t._v("Address")]),e("p",{staticClass:"mt-0"},[t._v(t._s(a.address))])]),e("div",{staticClass:"col"},[e("p",{staticClass:"mb-0 blue-text"},[t._v("Delivery number")]),e("p",{staticClass:"mt-0"},[t._v(t._s(a.delivery_number))])])]):"Item Receipt"===a.recordtype?e("div",{staticClass:"row"},[e("div",{staticClass:"col"},[e("p",{staticClass:"mb-0 blue-text"},[t._v("From business")]),e("p",{staticClass:"mt-0"},[t._v(t._s(a.sender_location_address))])]),e("div",{staticClass:"col"},[e("p",{staticClass:"mb-0 blue-text"},[t._v("To business")]),e("p",{staticClass:"mt-0"},[t._v(" ("+t._s(a.location)+") "+t._s(a.receiver_location_address)+" ")])])]):e("div",{staticClass:"row"},[e("div",{staticClass:"col"},[e("p",{staticClass:"mb-0 blue-text"},[t._v("Address")]),e("p",{staticClass:"mt-0"},[t._v(t._s(a.address))])]),e("div",{staticClass:"col"},[e("p",{staticClass:"mb-0 blue-text"},[t._v("Lot/Serial number")]),e("p",{staticClass:"mt-0"},[t._v(t._s(a.delivery_number))])])]),"inventoryadjustment"===a.recordtype?e("div",{staticClass:"row"},[e("div",{staticClass:"col"},[e("p",{staticClass:"mb-0 blue-text"},[t._v("Reason")]),e("p",{staticClass:"mt-0"},[t._v(" "+t._s(a.custbody_atlas_inv_adj_reason)+" ")])])]):t._e()])})),0):e("div",[e("p",{staticStyle:{"font-style":"italic"}},[t._v("No data to display")])])])],1)},o=[],r=(a(4012),a(4972),a(8100)),i=(a(18),a(2122),a(7011),a(6921),a(4411),a(7387)),n=a.n(i),l={name:"DataTableReports",data:function(){return{datatable_content:null,datatable:null,transaction_statement:null,transaction_information:{},data_purchase_orders:[],modalShown:!1,modal_pack:!1,modal_pack_item_info:{},modal_th:!1,modal_th_item_info:[],modal_suspect:!1,modal_internal_movements:!1,modal_internal_movements_lot:!1,datatable_allRecordTypes_perItem:[],serialNumber:"",reason:"",item_ndc:"",lot_number:"",quantity:""}},props:{data:{type:Array,required:!0}},watch:{datatable_content(t){this.datatable&&(this.datatable.clear(),this.datatable.rows.add(t),this.datatable.draw())},data(t){this.datatable&&(this.datatable.clear(),this.datatable.rows.add(t),this.datatable.draw())},modalShown(t){t&&setTimeout((()=>{this.showDatatablePurchaseOrder()}),100)},modal_internal_movements(t){t&&setTimeout((()=>{this.showDatatableInternalMovements()}),100)}},mounted(){this.datatable_content=this.data,this.datatable=new r.Z("#datatableComp",{responsive:!0,order:[],searching:!0,columns:[{data:"date_upload",title:"Date Of Upload"},{data:"purchase_orders",title:"Purchase Orders"},{data:"sender_name",title:"Vendor"},{data:"status_error",title:"Status Errors",render:function(t){return!0===t?"<div class='cheto' style='background-color:rgb(157, 0, 0) !important;border-color:rgb(157, 0, 0) !important;'>Yes</div>":"<div class='cheto' style='background-color:#077cab !important;'>No</div>"}},{data:"date_upload",title:"Options",render:function(){return'\n            <div class="d-flex justify-content-center">\n              <div class="option-btn btn btn-light text-center" style="margin-right:10px;">\n                <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 384 512">\x3c!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --\x3e<path d="M64 464c-8.8 0-16-7.2-16-16V64c0-8.8 7.2-16 16-16H224v80c0 17.7 14.3 32 32 32h80V448c0 8.8-7.2 16-16 16H64zM64 0C28.7 0 0 28.7 0 64V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V154.5c0-17-6.7-33.3-18.7-45.3L274.7 18.7C262.7 6.7 246.5 0 229.5 0H64zm56 256c-13.3 0-24 10.7-24 24s10.7 24 24 24H264c13.3 0 24-10.7 24-24s-10.7-24-24-24H120zm0 96c-13.3 0-24 10.7-24 24s10.7 24 24 24H264c13.3 0 24-10.7 24-24s-10.7-24-24-24H120z"/></svg>              </div>\n              \n            </div>\n            '}}]});const t=this;n()("#datatableComp").on("click",".option-btn",(function(){const e=t.datatable.row(n()(this).closest("tr")).data();t.$refs["modal_transaction_details"].show(),t.modalShown=!0,t.transaction_statement=e.transaction_statement,t.transaction_information.purchase_orders=e.purchase_orders,t.transaction_information.sender_name=e.sender_name,t.transaction_information.sender_SGLN=e.sender_SGLN,t.transaction_information.sender_location_name=e.sender_location_name,t.transaction_information.sender_location_address=e.sender_location_address,t.transaction_information.receiver_location_name=e.receiver_location_name,t.transaction_information.receiver_location_address=e.receiver_location_address,t.transaction_information.shipment_date=e.shipment_date,t.data_purchase_orders=e,console.log("rowData:",e)})),n()("#datatableComp").on("click",".option-btn-internal-movements",(function(){const e=t.datatable.row(n()(this).closest("tr")).data();console.log("INTERNAL MOVEMENTS ROWDATA:",e),t.$refs["modal_internal_movements"].show(),t.modal_internal_movements=!0,t.data_purchase_orders=e}))},methods:{hideModal(){this.modalShown=!1},hideModal_pack(){this.modal_pack=!1},hideModal_th(){this.modal_th=!1},hideModal_suspect(){this.modal_suspect=!1},hideModal_internal_movements(){this.modal_internal_movements=!1},hideModal_internal_movements_lot(){this.modal_internal_movements_lot=!1},submitForm(){try{console.log("Serial Number:",this.serialNumber),console.log("Reason:",this.reason)}catch(t){console.error("Error occurred in submitForm",t)}},showDatatablePurchaseOrder(){try{let t=this.data_purchase_orders.items_info;console.log({aux:t}),this.data_purchase_orders.dataTable=new r.Z("#"+this.data_purchase_orders.purchase_order_id,{responsive:!0,data:this.data_purchase_orders.items_info,searching:!0,order:[],columns:[{data:"sgtin",title:"SGTIN"},{data:"ndc",title:"NDC"},{data:"product_name",title:"Product Name"},{data:"dosage",title:"Dosage"},{data:"strength",title:"Strength"},{data:"container_size",title:"Container Size"},{data:"lot_number",title:"Lot Number"},{data:"ndc",title:"Options",render:function(){return'\n            <div class="d-flex justify-content-center">\n            <div class="option-item-hierarchy-btn btn btn-light text-center" title=\'Packaging information\'>\n              <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 576 512">\x3c!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --\x3e<path d="M248 0H208c-26.5 0-48 21.5-48 48V160c0 35.3 28.7 64 64 64H352c35.3 0 64-28.7 64-64V48c0-26.5-21.5-48-48-48H328V80c0 8.8-7.2 16-16 16H264c-8.8 0-16-7.2-16-16V0zM64 256c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H224c35.3 0 64-28.7 64-64V320c0-35.3-28.7-64-64-64H184v80c0 8.8-7.2 16-16 16H120c-8.8 0-16-7.2-16-16V256H64zM352 512H512c35.3 0 64-28.7 64-64V320c0-35.3-28.7-64-64-64H472v80c0 8.8-7.2 16-16 16H408c-8.8 0-16-7.2-16-16V256H352c-15 0-28.8 5.1-39.7 13.8c4.9 10.4 7.7 22 7.7 34.2V464c0 12.2-2.8 23.8-7.7 34.2C323.2 506.9 337 512 352 512z"/></svg>\n              </div>\n            <div class="option-item-th-btn btn btn-light text-center" title=\'Transaction History of item\'>\n              <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 640 512">\x3c!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --\x3e<path d="M128 72a24 24 0 1 1 0 48 24 24 0 1 1 0-48zm32 97.3c28.3-12.3 48-40.5 48-73.3c0-44.2-35.8-80-80-80S48 51.8 48 96c0 32.8 19.7 61 48 73.3V224H32c-17.7 0-32 14.3-32 32s14.3 32 32 32H288v54.7c-28.3 12.3-48 40.5-48 73.3c0 44.2 35.8 80 80 80s80-35.8 80-80c0-32.8-19.7-61-48-73.3V288H608c17.7 0 32-14.3 32-32s-14.3-32-32-32H544V169.3c28.3-12.3 48-40.5 48-73.3c0-44.2-35.8-80-80-80s-80 35.8-80 80c0 32.8 19.7 61 48 73.3V224H160V169.3zM488 96a24 24 0 1 1 48 0 24 24 0 1 1 -48 0zM320 392a24 24 0 1 1 0 48 24 24 0 1 1 0-48z"/></svg>\n              </div>\n              \n            </div>\n            '}}]});const e=this;n()("#"+e.data_purchase_orders.purchase_order_id).on("click",".option-item-hierarchy-btn",(function(){const t=e.data_purchase_orders.dataTable.row(n()(this).closest("tr")).data();console.log("ROWDATA TH:",t),e.$refs["modal_pack"].show(),e.modalShown=!0,e.modal_pack_item_info={sgtin:t.sgtin,level_1:t.level_1,level_2:t.level_2,level_3:t.level_3}})),n()("#"+e.data_purchase_orders.purchase_order_id).on("click",".option-item-th-btn",(function(){const t=e.data_purchase_orders.dataTable.row(n()(this).closest("tr")).data();console.log("ROWDATA OF HISTORY",t),e.$refs["modal_th"].show(),e.modal_th=!0,e.modal_th_item_info=t.trans_hist})),n()("#"+e.data_purchase_orders.purchase_order_id).on("click",".option-item-suspect-btn",(function(){const t=e.data_purchase_orders.dataTable.row(n()(this).closest("tr")).data();e.$refs["modal_suspect"].show(),e.modal_suspect=!0,e.serialNumber=t.sgtin,e.lot_number=t.lot_number,e.item_ndc=t.ndc,e.quantity=1}))}catch(t){console.error("Error occurred in showDatatablePurchaseOrder",t)}},showDatatableInternalMovements(){try{let t=this.data_purchase_orders.items_info;console.log({aux:t}),this.data_purchase_orders.dataTable=new r.Z("#"+this.data_purchase_orders.purchase_order_id,{responsive:!0,data:this.data_purchase_orders.items_info,searching:!0,order:[],columns:[{data:"ndc",title:"NDC"},{data:"product_name",title:"Product Name"},{data:"dosage",title:"Dosage"},{data:"strength",title:"Strength"},{data:"container_size",title:"Container Size"},{data:"lot_number",title:"Lot Number"},{data:"ndc",title:"Options",render:function(){return'\n            <div class="d-flex justify-content-center">\n            <div class="option-item-movements-btn btn btn-light text-center" title=\'Packaging information\'>\n              <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 576 512">\x3c!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --\x3e<path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z"/></svg>            \n            </div>\n            '}}]});const e=this;n()("#"+e.data_purchase_orders.purchase_order_id).on("click",".option-item-movements-btn",(function(){const t=e.data_purchase_orders.dataTable.row(n()(this).closest("tr")).data();console.log("ROWDATA PURCHASE ORDER INTERNAL MOVEMENTS:",t),e.datatable_allRecordTypes_perItem=t.receipts,e.$refs["modal_internal_movements_lot"].show(),e.modal_internal_movements_lot=!0}))}catch(t){console.error("Error occurred in showDatatableInternalMovements",t)}}}},c=l,_=a(1001),d=(0,_.Z)(c,s,o,!1,null,null,null),m=d.exports},3973:function(t,e,a){a.d(e,{Z:function(){return c}});var s=function(){var t=this;t._self._c;return t._m(0)},o=[function(){var t=this,e=t._self._c;return e("div",{staticStyle:{display:"flex","justify-content":"center","align-items":"end"},attrs:{id:"footer-component"}},[e("div",{staticClass:"blue-text",staticStyle:{"text-align":"center"}},[t._v("Powered by "),e("strong",[t._v("Freebug")])])])}],r={name:"FooterFreebugComponent",data(){return{}}},i=r,n=a(1001),l=(0,n.Z)(i,s,o,!1,null,null,null),c=l.exports},2203:function(t,e,a){a.d(e,{Z:function(){return d}});var s=function(){var t=this,e=t._self._c;return e("div",{class:!0===this.$store.state.toggleSideBar?"collapsed":"hide_bar"},[e("b-row",[e("b-col",{staticClass:"d-flex justify-content-center align-items-center mt-4",attrs:{md:"12",sm:"12"}},[e("b-img",{staticClass:"align-items-center",attrs:{width:"70px",height:"70px",src:this.$store.state.user_data.image_url,rounded:"circle",alt:"Circle image"}})],1),e("b-col",{staticClass:"d-flex justify-content-center mt-2",attrs:{md:"12",sm:"12"}},[e("h4",{staticClass:"userName mb-0"},[t._v(t._s(this.$store.state.user_data.user_name))])]),e("b-col",{staticClass:"d-flex justify-content-center py-0 my-0",attrs:{md:"12",sm:"12"}},[e("p",{staticClass:"userRole"},[t._v(t._s(this.$store.state.user_data.role))])])],1),t._l(t.menuItemsAr,(function(a){return e("b-row",{key:a.id,staticClass:"mb-2",on:{mouseover:function(e){return t.toggleSubMenu(a)},mouseleave:function(e){return t.toggleSubMenuLeave(a)}}},[e("a",{attrs:{href:a.path}},[e("b-col",{staticClass:"menuItem d-flex align-items-center py-2",attrs:{md:"12"}},[e("span",{staticClass:"mx-3"},[e("font-awesome-icon",{attrs:{icon:a.icon,size:"1x"}})],1),e("span",[t._v(t._s(a.title))])])],1),!0===a.hasChildren&&!0===a.toggled?e("div",t._l(a.children,(function(a){return e("ul",{key:a.id,staticClass:"menuSubItem py-2",staticStyle:{"list-style-type":"none"}},[e("a",{attrs:{href:a.path}},[e("li",[e("span",{staticClass:"mx-3"},[e("font-awesome-icon",{attrs:{icon:a.icon,size:"1x"}})],1),e("span",[t._v(t._s(a.subtitle))])])])])})),0):t._e()])}))],2)},o=[];const r=()=>{const t=[{id:1,title:"EPCIS uploads",path:"#/",icon:"fa-solid fa-file",hasChildren:!1},{id:3,title:"SuiteTrace Academy",path:"#/documentation",icon:"fa-solid fa-graduation-cap",hasChildren:!0,toggled:!1,children:[{subtitle:"Documentation",icon:"fa-solid fa-book",path:"#/documentation"}]}];return t};var i=r,n={name:"SideNavBar",data:function(){return{isToggle:null,menuItemsAr:[]}},mounted(){this.isToggle=this.$store.state.toggleSideBar,console.log("val of store:",this.$store.state.toggleSideBar),this.menuItemsAr=i(),console.log(this.menuItemsAr)},methods:{toggleSubMenu(t){t.toggled=!0},toggleSubMenuLeave(t){t.toggled=!1}}},l=n,c=a(1001),_=(0,c.Z)(l,s,o,!1,null,null,null),d=_.exports},8744:function(t,e,a){a.d(e,{Z:function(){return c}});var s=function(){var t=this,e=t._self._c;return e("div",[e("b-navbar",{attrs:{toggleable:"sm"}},[e("b-navbar-toggle",{attrs:{target:"nav-text-collapse"}}),e("b-navbar-brand",{staticClass:"pl-1"},[e("img",{attrs:{height:"65px",src:"https://7076975-sb1.app.netsuite.com/core/media/media.nl?id=44579&c=7076975_SB1&h=kSm8fxd41gQWxjE9osFgVK9OuF3OhXxBPI-tmF96sAXI4LFy",alt:"Logo healix"}})]),e("b-collapse",{attrs:{id:"nav-text-collapse","is-nav":""}},[e("b-navbar-nav",[e("b-button",{staticClass:"btn_removeBKColor",on:{click:t.handleToggleSideBar}},[e("font-awesome-icon",{attrs:{icon:"fa-solid fa-bars",size:"1x"}})],1)],1)],1)],1)],1)},o=[],r={name:"TopNavBar",components:{},data:function(){return{}},methods:{handleToggleSideBar(){this.$store.commit("setToggleSideBar",!this.$store.state.toggleSideBar)}}},i=r,n=a(1001),l=(0,n.Z)(i,s,o,!1,null,null,null),c=l.exports},6286:function(__unused_webpack_module,__webpack_exports__,__webpack_require__){var _template_SideNavBar_vue__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__(2203),_template_TopNavBar_vue__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__(8744),_template_Commons_FooterFreebug_vue__WEBPACK_IMPORTED_MODULE_2__=__webpack_require__(3973),axios__WEBPACK_IMPORTED_MODULE_4__=__webpack_require__(4161),_DataTableReports_vue__WEBPACK_IMPORTED_MODULE_3__=__webpack_require__(8279);__webpack_exports__.Z={name:"SuiteTraceReports",components:{FooterFreebugComponent:_template_Commons_FooterFreebug_vue__WEBPACK_IMPORTED_MODULE_2__.Z,SideNavBar:_template_SideNavBar_vue__WEBPACK_IMPORTED_MODULE_0__.Z,TopNavBar:_template_TopNavBar_vue__WEBPACK_IMPORTED_MODULE_1__.Z,DataTableReportsVue:_DataTableReports_vue__WEBPACK_IMPORTED_MODULE_3__.Z},data:function(){return{datos_datatable:null}},mounted(){this.getTrackSearch()},methods:{getTrackSearch(){try{let self=this;console.log("getTrackSearch -self:",self);let str="\n        var urlMode=null;\n      \n        require(['N/url'],function(urlMode){\n          var url=urlMode.resolveScript({\n            scriptId:'customscript_tkio_wetrackntrace_serv_sl',\n            deploymentId:\"customdeploy_tkio_wetrackntrace_serv_sl\",\n            returnExternalUrl:false,\n            params:{getTrackSearch:true}\n          });\n          self.getSearchResponse(url)\n        });\n        ";eval(str)}catch(err){console.error("An error occurred in getTrackSearch:",err)}},getSearchResponse(t){const e={method:"GET",url:t,headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,PUT,POST,OPTIONS","Access-Control-Allow-Headers":"authorization"}};axios__WEBPACK_IMPORTED_MODULE_4__.Z.request(e).then((t=>{console.log("RESP full search: ",t.data),this.datos_datatable=t.data})).catch((t=>{console.log("Hubo errores: ",t)}))}}}},7703:function(t,e,a){var s=a(6369),o=function(){var t=this,e=t._self._c;return e("div",{attrs:{id:"app"}},[e("router-view",[e("SuiteTraceReports")],1)],1)},r=[],i=function(){var t=this,e=t._self._c;return e("div",{attrs:{id:"global"}},[e("div",{staticClass:"topNavBarC"},[e("TopNavBar")],1),e("div",{staticClass:"sideNavBarC"},[e("SideNavBar")],1),e("div",{staticClass:"moduleComponent"},[e("div",{staticClass:"card"},[e("h1",{staticClass:"blue-text"},[e("font-awesome-icon",{attrs:{icon:"fa-solid fa-file",size:"1x"}}),t._v(" SuiteTrace | EPCIS Uploads ")],1),e("small",{staticClass:"text-left"},[t._v("Displays SuiteTrace reports from EPCIS file receptions")]),e("DataTableReportsVue",{attrs:{data:t.datos_datatable}})],1),e("FooterFreebugComponent")],1)])},n=[],l=a(6286),c=l.Z,_=a(1001),d=(0,_.Z)(c,i,n,!1,null,null,null),m=d.exports,u={name:"App",components:{SuiteTraceReports:m}},p=u,b=(0,_.Z)(p,o,r,!1,null,null,null),v=b.exports,h=a(6681),f=a(9425),g=(a(7024),a(2631)),C=[{path:"/",component:m}],w=a(3822);s["default"].use(w.ZP);const x=new w.ZP.Store({state:{lot_serial_numbers:[{}],items_ndc:[{}],toggleSideBar:!0,user_data:{user_name:"John Doe",role:"Supplier",image_url:"https://firebasestorage.googleapis.com/v0/b/bloona-55051.appspot.com/o/alexander-hipp-iEEBWgY_6lA-unsplash.jpg?alt=media&token=00f5cae5-004a-49e6-a3bb-bda977ee0121"}},mutations:{setLot_serial_numbers(t,e){t.lot_serial_numbers=e},setItems_ndc(t,e){t.items_ndc=e},setToggleSideBar(t,e){t.toggleSideBar=e},setUser_data(t,e){t.user_data=e}}});var y=x,k=a(3494),S=a(7749),I=a(8539),T=a(8429);k.vI.add(I.BC0),k.vI.add(I.xiG),k.vI.add(I.Rpv),k.vI.add(I.ZUQ),k.vI.add(I.eDR),k.vI.add(I.xHz),k.vI.add(I.GiY),k.vI.add(I.Obi),k.vI.add(I.hSg),k.vI.add(I.QQm),k.vI.add(I.dWM),k.vI.add(I.WA2),k.vI.add(I.fV7),k.vI.add(T.$9F),k.vI.add(I.J9Y),k.vI.add(I.UOv),k.vI.add(I.rtB),k.vI.add(I.Uwo),k.vI.add(I.EOp),k.vI.add(I.eFW),k.vI.add(I.G_j),k.vI.add(I.x6G),k.vI.add(I.LEp),k.vI.add(I.I4f),k.vI.add(I.FL8),k.vI.add(I.Xf_),k.vI.add(I.gMD),s["default"].component("font-awesome-icon",S.GN),s["default"].use(h.XG7),s["default"].use(f.A7),s["default"].use(g.Z),s["default"].config.productionTip=!1;const M=new g.Z({routes:C});new s["default"]({store:y,render:t=>t(v),router:M}).$mount("#app")}},__webpack_module_cache__={};function __webpack_require__(t){var e=__webpack_module_cache__[t];if(void 0!==e)return e.exports;var a=__webpack_module_cache__[t]={exports:{}};return __webpack_modules__[t].call(a.exports,a,a.exports,__webpack_require__),a.exports}__webpack_require__.m=__webpack_modules__,function(){var t=[];__webpack_require__.O=function(e,a,s,o){if(!a){var r=1/0;for(c=0;c<t.length;c++){a=t[c][0],s=t[c][1],o=t[c][2];for(var i=!0,n=0;n<a.length;n++)(!1&o||r>=o)&&Object.keys(__webpack_require__.O).every((function(t){return __webpack_require__.O[t](a[n])}))?a.splice(n--,1):(i=!1,o<r&&(r=o));if(i){t.splice(c--,1);var l=s();void 0!==l&&(e=l)}}return e}o=o||0;for(var c=t.length;c>0&&t[c-1][2]>o;c--)t[c]=t[c-1];t[c]=[a,s,o]}}(),function(){__webpack_require__.n=function(t){var e=t&&t.__esModule?function(){return t["default"]}:function(){return t};return __webpack_require__.d(e,{a:e}),e}}(),function(){__webpack_require__.d=function(t,e){for(var a in e)__webpack_require__.o(e,a)&&!__webpack_require__.o(t,a)&&Object.defineProperty(t,a,{enumerable:!0,get:e[a]})}}(),function(){__webpack_require__.g=function(){if("object"===typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(t){if("object"===typeof window)return window}}()}(),function(){__webpack_require__.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)}}(),function(){__webpack_require__.r=function(t){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})}}(),function(){var t={143:0};__webpack_require__.O.j=function(e){return 0===t[e]};var e=function(e,a){var s,o,r=a[0],i=a[1],n=a[2],l=0;if(r.some((function(e){return 0!==t[e]}))){for(s in i)__webpack_require__.o(i,s)&&(__webpack_require__.m[s]=i[s]);if(n)var c=n(__webpack_require__)}for(e&&e(a);l<r.length;l++)o=r[l],__webpack_require__.o(t,o)&&t[o]&&t[o][0](),t[o]=0;return __webpack_require__.O(c)},a=self["webpackChunksuitetrace_supplier_portal_vue"]=self["webpackChunksuitetrace_supplier_portal_vue"]||[];a.forEach(e.bind(null,0)),a.push=e.bind(null,a.push.bind(a))}();var __webpack_exports__=__webpack_require__.O(void 0,[998],(function(){return __webpack_require__(7703)}));__webpack_exports__=__webpack_require__.O(__webpack_exports__)})();