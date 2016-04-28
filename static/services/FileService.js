angular.module('ServicesModule').factory('FileService', ['$window', 'FileSaver', 'Blob',
    function($window, FileSaver, Blob){

    return {
        tableToExcel:function(tableId, worksheetName){
            var template='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>',
                format = function(s,c){return s.replace(/{(\w+)}/g,function(m,p){return c[p];})};
            var table = angular.element(document.getElementById(tableId));
            var ctx =  {worksheet:worksheetName,table:table.html()};
            var blob = new Blob([format(template,ctx)], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8"
            });

            FileSaver.saveAs(blob, worksheetName+".xls");
        },
        dataToFile:function(data, fileNameAndExt){
            var blob = new Blob([data], { type: 'text/plain;charset=utf-8' });

            FileSaver.saveAs(blob, fileNameAndExt);
        }
    };
}]);