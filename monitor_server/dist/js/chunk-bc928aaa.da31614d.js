(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-bc928aaa"],{2713:function(e,t,n){"use strict";n.r(t);var a=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",{staticClass:"table"},[n("div",{staticClass:"container"},[n("div",{staticClass:"handle-box"},[n("el-input",{staticClass:"handle-input mr10",attrs:{placeholder:"筛选关键词"},model:{value:e.select_word,callback:function(t){e.select_word=t},expression:"select_word"}}),n("el-button",{attrs:{type:"primary"},on:{click:e.search}},[e._v("服务器筛选")]),n("el-button",{attrs:{type:"primary"},on:{click:e.delAll}},[e._v("批量删除")]),n("el-button",{staticClass:"mr10",attrs:{type:"primary"},on:{click:function(t){e.addVisible=!0}}},[e._v("新增节点")])],1),n("el-table",{staticClass:"table",attrs:{data:e.pageData,border:""},on:{"selection-change":e.handleSelectionChange}},[n("el-table-column",{attrs:{type:"selection",width:"55",align:"center"}}),n("el-table-column",{attrs:{prop:"id",label:"id",sortable:"",width:"120"}}),n("el-table-column",{attrs:{prop:"name",label:"名称",sortable:"",width:"120"}}),n("el-table-column",{attrs:{prop:"address",label:"公钥",sortable:"",width:"120"}}),n("el-table-column",{attrs:{prop:"host",label:"地址",width:"200"}}),n("el-table-column",{attrs:{prop:"port",label:"端口"}}),n("el-table-column",{attrs:{prop:"remarks",label:"备注信息"}}),n("el-table-column",{attrs:{prop:"createdAt",label:"创建日期"}}),n("el-table-column",{attrs:{prop:"updatedAt",label:"更新日期"}}),n("el-table-column",{attrs:{label:"操作",width:"180",align:"center"},scopedSlots:e._u([{key:"default",fn:function(t){return[n("el-button",{attrs:{type:"text"},on:{click:function(n){return e.handleEdit(t.row)}}},[e._v("编辑")]),n("el-button",{staticClass:"red",attrs:{type:"text"},on:{click:function(n){return e.handleDelete(t.row)}}},[e._v("删除")]),n("el-button",{attrs:{type:"text"},on:{click:function(n){return e.checkNodeDetail(t.row)}}},[e._v("查看详情")])]}}])})],1),n("div",{staticClass:"pagination"},[n("el-pagination",{attrs:{background:"",layout:"prev, pager, next","page-size":e.pageSize,total:e.tableData.length},on:{"current-change":e.handleCurrentChange}})],1)],1),n("el-dialog",{attrs:{title:"新增",visible:e.addVisible,width:"30%"},on:{"update:visible":function(t){e.addVisible=t}}},[n("el-form",{attrs:{model:e.currentHandleNode,"label-width":"90px"}},[n("el-form-item",{attrs:{label:"名称"}},[n("el-input",{model:{value:e.currentHandleNode.name,callback:function(t){e.$set(e.currentHandleNode,"name",t)},expression:"currentHandleNode.name"}})],1),n("el-form-item",{attrs:{label:"公钥"}},[n("el-input",{model:{value:e.currentHandleNode.address,callback:function(t){e.$set(e.currentHandleNode,"address",t)},expression:"currentHandleNode.address"}})],1),n("el-form-item",{attrs:{label:"地址"}},[n("el-input",{model:{value:e.currentHandleNode.host,callback:function(t){e.$set(e.currentHandleNode,"host",t)},expression:"currentHandleNode.host"}})],1),n("el-form-item",{attrs:{label:"端口"}},[n("el-input",{model:{value:e.currentHandleNode.port,callback:function(t){e.$set(e.currentHandleNode,"port",t)},expression:"currentHandleNode.port"}})],1),n("el-form-item",{attrs:{label:"备注信息"}},[n("el-input",{model:{value:e.currentHandleNode.remarks,callback:function(t){e.$set(e.currentHandleNode,"remarks",t)},expression:"currentHandleNode.remarks"}})],1)],1),n("span",{staticClass:"dialog-footer",attrs:{slot:"footer"},slot:"footer"},[n("el-button",{on:{click:function(t){e.addVisible=!1}}},[e._v("取 消")]),n("el-button",{attrs:{type:"primary"},on:{click:e.saveAdd}},[e._v("确 定")])],1)],1),n("el-dialog",{attrs:{title:"编辑",visible:e.editVisible,width:"30%"},on:{"update:visible":function(t){e.editVisible=t}}},[n("el-form",{attrs:{model:e.currentHandleNode,"label-width":"90px"}},[n("el-form-item",{attrs:{label:"名称"}},[n("el-input",{model:{value:e.currentHandleNode.name,callback:function(t){e.$set(e.currentHandleNode,"name",t)},expression:"currentHandleNode.name"}})],1),n("el-form-item",{attrs:{label:"公钥"}},[n("el-input",{model:{value:e.currentHandleNode.address,callback:function(t){e.$set(e.currentHandleNode,"address",t)},expression:"currentHandleNode.address"}})],1),n("el-form-item",{attrs:{label:"地址"}},[n("el-input",{model:{value:e.currentHandleNode.host,callback:function(t){e.$set(e.currentHandleNode,"host",t)},expression:"currentHandleNode.host"}})],1),n("el-form-item",{attrs:{label:"端口"}},[n("el-input",{model:{value:e.currentHandleNode.port,callback:function(t){e.$set(e.currentHandleNode,"port",t)},expression:"currentHandleNode.port"}})],1),n("el-form-item",{attrs:{label:"备注信息"}},[n("el-input",{model:{value:e.currentHandleNode.remarks,callback:function(t){e.$set(e.currentHandleNode,"remarks",t)},expression:"currentHandleNode.remarks"}})],1)],1),n("span",{staticClass:"dialog-footer",attrs:{slot:"footer"},slot:"footer"},[n("el-button",{on:{click:function(t){e.editVisible=!1}}},[e._v("取 消")]),n("el-button",{attrs:{type:"primary"},on:{click:e.saveEdit}},[e._v("确 定")])],1)],1),n("el-dialog",{attrs:{title:"提示",visible:e.delVisible,width:"300px",center:""},on:{"update:visible":function(t){e.delVisible=t}}},[n("div",{staticClass:"del-dialog-cnt"},[e._v("删除不可恢复，是否确定删除？")]),n("span",{staticClass:"dialog-footer",attrs:{slot:"footer"},slot:"footer"},[n("el-button",{on:{click:function(t){e.delVisible=!1}}},[e._v("取 消")]),n("el-button",{attrs:{type:"primary"},on:{click:e.deleteRow}},[e._v("确 定")])],1)])],1)},r=[],l=(n("0bb1"),n("40f8"),n("612f"),n("4453"),n("a7ca")),o=(n("48fb"),n("3a23"),n("e0c1"),n("93fe"),n("3556")),s=(n("aaa4"),n("52c1")),i={name:"nodeList",data:function(){return{tableData:[],pageSize:6,cur_page:1,multipleSelection:[],select_word:"",addVisible:!1,editVisible:!1,delVisible:!1,currentHandleNode:{id:0,name:"",address:"",host:"",port:"",remarks:"",createdAt:"",updatedAt:""}}},created:function(){this.tableData=this.nodesInfo},watch:{select_word:function(e,t){""!==t&&""===e&&(this.tableData=this.nodesInfo)},nodesInfo:function(e,t){this.tableData=e,this.search()}},computed:Object(o["a"])({pageData:function(){return this.tableData.slice(this.pageSize*(this.cur_page-1),this.pageSize*this.cur_page)}},Object(s["b"])({nodesInfo:function(e){return e.unl}})),methods:{handleCurrentChange:function(e){this.cur_page=e},search:function(){var e=this;this.tableData=this.nodesInfo.filter(function(t){return!!t.name.includes(e.select_word)||(!!t.address.includes(e.select_word)||(!!t.host.includes(e.select_word)||(!!t.port.toString().includes(e.select_word)||!!t.remarks.includes(e.select_word))))})},handleEdit:function(e){this.currentHandleNode=e,this.editVisible=!0},handleDelete:function(e){this.currentHandleNode=e,this.delVisible=!0},delAll:function(){var e=this,t=[];Object(l["a"])(regeneratorRuntime.mark(function n(){var a,r,l,o,s,i,c;return regeneratorRuntime.wrap(function(n){while(1)switch(n.prev=n.next){case 0:a=!0,r=!1,l=void 0,n.prev=3,o=e.multipleSelection[Symbol.iterator]();case 5:if(a=(s=o.next()).done){n.next=14;break}return i=s.value,n.next=9,e.$axios.post("/deleteNode",i);case 9:c=n.sent,0!==c.code?t.push(c.msg):e.$message.success("删除成功, ".concat(i.name));case 11:a=!0,n.next=5;break;case 14:n.next=20;break;case 16:n.prev=16,n.t0=n["catch"](3),r=!0,l=n.t0;case 20:n.prev=20,n.prev=21,a||null==o.return||o.return();case 23:if(n.prev=23,!r){n.next=26;break}throw l;case 26:return n.finish(23);case 27:return n.finish(20);case 28:case"end":return n.stop()}},n,null,[[3,16,20,28],[21,,23,27]])}))().then(function(){t.length>0&&e.$message.error(t.join(", "))}).catch(function(t){e.$message.error(t)}).finally(function(){e.$store.dispatch("getUnl"),e.multipleSelection=[]})},handleSelectionChange:function(e){this.multipleSelection=e},checkNodeDetail:function(e){this.$store.commit("switchCurrentNode",e),this.$router.push("dashboard/".concat(e.id))},saveAdd:function(){var e=this;this.addVisible=!1,this.$axios.post("/addNode",this.currentHandleNode).then(function(t){0!==t.code?e.$message.error(t.msg):(e.$message.success("新增成功"),e.$store.dispatch("getUnl"))}).catch(function(t){e.$message.error(t)})},saveEdit:function(){var e=this;this.editVisible=!1,this.$axios.post("/modifyNode",this.currentHandleNode).then(function(t){0!==t.code?e.$message.error(t.msg):(e.$message.success("修改成功"),e.$store.dispatch("getUnl"))}).catch(function(t){e.$message.error(t)})},deleteRow:function(){var e=this;this.delVisible=!1,this.$axios.post("/deleteNode",this.currentHandleNode).then(function(t){0!==t.code?e.$message.error(t.msg):(e.$message.success("删除成功"),e.$store.dispatch("getUnl"))}).catch(function(t){e.$message.error(t)})}}},c=i,d=(n("f701"),n("17cc")),u=Object(d["a"])(c,a,r,!1,null,"406b8060",null);t["default"]=u.exports},"338e":function(e,t,n){},3556:function(e,t,n){"use strict";function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function r(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{},r=Object.keys(n);"function"===typeof Object.getOwnPropertySymbols&&(r=r.concat(Object.getOwnPropertySymbols(n).filter(function(e){return Object.getOwnPropertyDescriptor(n,e).enumerable}))),r.forEach(function(t){a(e,t,n[t])})}return e}n.d(t,"a",function(){return r})},f701:function(e,t,n){"use strict";var a=n("338e"),r=n.n(a);r.a}}]);
//# sourceMappingURL=chunk-bc928aaa.da31614d.js.map