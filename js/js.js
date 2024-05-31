let tableParser = new TableParser();
let input;
let relation;
let output;
let diagram;
let result;
let tableList;
let diagramOffset = {};

function saveResult()
{
    let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
    </head>
    <body>
    <style>
        .all{
            padding: 20px;
            position: relative;
            color: #222222;
            max-width: 1200px;
            margin: auto;
        }
        body{
            margin: 0;
            position: relative;
        }
        textarea{
            width: 100%;
            box-sizing: border-box;
            height: calc(30vh - 80px);
            padding: 20px;
            font-size: 14px;
            border: 1px solid #DDDDDD;
            font-family: 'Courier New', Courier, monospace;
        }
        table{
            margin-bottom: 20px;
            border-collapse: collapse;
        }
        table thead td{
            font-weight: bold;
        }
        table td{
            padding: 5px 10px;
        }
        
        .input-area table td{
            padding: 0;
        }
        .input-area table tr > td:nth-child(1){
            padding: 0 10px 0 0;
        }
        .input-area table tr > td:nth-child(2){
            padding: 0 0 0 10px;
        }
        .output-area{
            border: 1px solid #DDDDDD;
            height: calc(30vh - 80px);
            overflow: auto;
        }
        .output{
            padding: 20px;
        }
        h3{
            margin: 5px 0;
            padding: 0;
        }        
        h4{
            margin: 5px 0;
            padding: 0;
        }
    </style>
    <div class="all">`
    + `<h3>Table Description</h3>`
    + document.getElementById('output').innerHTML
    + `<h3>Entity Relationship Diagram</h3>`
    + diagram.innerHTML
    + '</div>'
    +  `</body>`
    +  `</html>`

    
    var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    saveAs(blob, "data.html");
}

function saveSource()
{
    let source = {
        sql: input.value,
        relation: relation.value
    }
    
    var blob = new Blob([JSON.stringify(source)], { type: 'application/json;charset=utf-8' });
    saveAs(blob, "data.json");
}

function loadSource()
{
    document.querySelector("input[type=file]").click();
}

function parseSource()
{
    const [file] = document.querySelector("input[type=file]").files;
    const reader = new FileReader();

    reader.addEventListener("load", () => {
        let sqlLs = 'sqlLs';
        let relLs = 'relLs';
        let json = JSON.parse(reader.result);
        input.value = json.sql;
        relation.value = json.relation;
        window.localStorage.setItem(sqlLs, input.value);
        window.localStorage.setItem(relLs, relation.value);
        processInput();
        processRelation();
    },
    false,
    );

    if (file) {
        reader.readAsText(file);
    }
}

function relationshipTextLong(text)
{
    text = text.split(' > ').join(' >--+ ');
    text = text.split(' < ').join(' +--< ');
    text = text.split(' >< ').join(' >--< ');
    text = text.split(' - ').join(' +--+ ');
    return text;
}

function relationshipTextSort(text)
{
    text = text.split(' >--+ ').join(' > ');
    text = text.split(' +--< ').join(' < ');
    text = text.split(' >--< ').join(' >< ');
    text = text.split(' +--+ ').join(' - ');
    return text;
}

function initAll()
{
    input = document.querySelector('#input');
    relation = document.querySelector('#relation');
    output = document.querySelector('#output');
    diagram = document.querySelector('#diagram');
    
    let sqlLs = 'sqlLs';
    let relLs = 'relLs';
    
    let sql = window.localStorage.getItem(sqlLs);
    if(typeof sql != 'undefined')
    {
        input.value = sql; 
    }
    let rel = window.localStorage.getItem(relLs);
    if(typeof rel != 'undefined')
    {
        relation.value = rel; 
    }
    
    input.addEventListener('change', function(){
        input.value = fixSql(input.value);
        window.localStorage.setItem(sqlLs, input.value);
        processInput();
        processRelation();
    });
    
    relation.addEventListener('change', function(){
        relation.value = relationshipTextSort(relation.value);
        window.localStorage.setItem(relLs, relation.value);
        processInput();
        processRelation();
    });
    
    document.querySelector("input[type=file]").addEventListener('change', function(e){
        parseSource();
    });
    
    processInput();
    processRelation();
}
function fixSql(sql)
{
    return sql.split('`',).join('');
}
function processInput()
{
    clearResult();
    
    tableParser.parseAll(input.value);

    result = tableParser.getResult();
    
    
    let div = document.createElement('div');
    
    tableList = {};
    for(let i = 0; i<result.length;i++)
    {
        tableList[result[i].tableName] = result[i];
        let tableName = document.createElement('h4');
        tableName.innerHTML = 'Table '+result[i].tableName;
        div.appendChild(tableName);
        div.appendChild(createTable(result[i]));
    }
    
    setResult(div.innerHTML);
}

function processRelation()
{
    let relStr = relation.value;
    let regex = /[^[\]]+(?=])/g;
    if(regex.test(relStr))
    {
        let words = relStr.match(regex)
        for(let i in words)
        {
            relStr = relStr.replace("["+words[i]+"]", ";");
        }
        let words2 = relStr.split(";");
        diagram.innerHTML = "";
        for(let i = 1; i < words2.length; i++)
        {   
            let lines = words2[i];
            lines = lines.trim();
            let rel = lines.split('\n');
            rel = splitRel(rel, ' >< ');
            rel = splitRel(rel, ' < ');
            rel = splitRel(rel, ' > ');
            rel = splitRel(rel, ' - ');
            let url = createDiagramAll(rel, lines);
            let img = document.createElement('img');
            img.setAttribute('src', url);
            let label = document.createElement('h4');
            label.innerText = words[i-1];
            diagram.appendChild(label);
            diagram.appendChild(img);
        }
    }
    else
    {
        lines = relation.value.trim();
        let rel = lines.split('\n');
        rel = splitRel(rel, ' >< ');
        rel = splitRel(rel, ' < ');
        rel = splitRel(rel, ' > ');
        rel = splitRel(rel, ' - ');
        let url = createDiagramAll(rel, lines);
        let img = document.createElement('img');
        img.setAttribute('src', url);
        diagram.appendChild(img);
    }
}

function getTable(rel)
{
    let arr = [];
    for(let i in rel)
    {
        if(rel[i].indexOf('.') > -1)
        {
            let arr2 = rel[i].split('.');
            let tbl = arr2[0].trim();
            if(!inArray(arr, tbl))
            {
                arr.push(tbl);
            }
        }
        else
        {
            let tbl = rel[i].trim();
            if(!inArray(arr, tbl))
            {
                arr.push(tbl);
            }
        }
    }
    return arr;
}
function createDiagramAll(rel, relationValue)
{
    diagramOffset = {};
    let diagramTables = getTable(rel);

    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext("2d");
    
    let dimension = getDimension(result, rel);
    let diagramProp = dimension.diagramProp;
    canvas.width = dimension.width;
    canvas.height = dimension.height;
    canvas.style.width = dimension.width + 'px';
    canvas.style.height = dimension.height + 'px';
    
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    
    for(let i in diagramTables)
    {
        createDiagram(ctx, diagramProp, diagramTables, relationValue, i);
    }
    
    
    let lines = relationValue.split('\n');
    
    for(let j in lines)
    {
        let line = [lines[j]];
        let rel2 = splitRel(line, ' >< ');
        rel2 = splitRel(rel2, ' < ');
        rel2 = splitRel(rel2, ' > ');
        rel2 = splitRel(rel2, ' - ');

        for(let i in rel2)
        {
            if(i < rel2.length - 1)
            {
                createDiagramRelation(ctx, diagramProp, rel2, lines[j], i);
            }
        }
    }    
    return canvas.toDataURL();
    
}

function createDiagramRelation(ctx, diagramProp, rel, relationValue, i)
{
    let diagramTables = getTable(rel);
    i = parseInt(i);
    let tableName = diagramTables[i];
    let tableName2 = null;
    if(typeof diagramTables[i+1] != 'undefined')
    {
        tableName2 = diagramTables[i+1];
    }
    else
    {
        tableName2 = tableName;
    }
    
    

    let j = parseInt(i) + 1;
    let entityLeft = rel[i].trim();
    let entityRight = rel[j].trim();
    let start = relationValue.indexOf(entityLeft) + entityLeft.length;
    let val = relationValue.substring(start).trim();
    let end = val.indexOf(' ');
    val = val.substring(0, end);
    let sign = val;    

    
    let leftCol = null;
    if(entityLeft.indexOf('.') > -1)
    {
        let arr1 = entityLeft.split('.');
        leftCol = arr1[1].trim();
    }
    
    let rightCol = null;
    if(entityRight.indexOf('.') > -1)
    {
        let arr1 = entityRight.split('.');
        rightCol = arr1[1].trim();
    }
    let leftTop = getColumnIndex(diagramProp, rel, i, entityLeft, leftCol) + 10;
    let rightTop = null;
    

    
    ctx.beginPath();
    ctx.strokeStyle = '#2669a4'; 
    
    
    let x1 = diagramOffset[tableName] + diagramProp.diagramWidth;
    let x2 = null;
    if(typeof tableName2 == 'undefined' || tableName == tableName2)
    {
        rightTop = getColumnIndex(diagramProp, rel, i, entityLeft, rightCol) + 10;
        
        x2 = x1;
        
        createRelationSignLeft(ctx, x1, leftTop, sign);
        createRelationSignRight(ctx, x2+12, rightTop, sign);
        
        ctx.moveTo(x1+12, leftTop); 
        ctx.lineTo(x2+12, rightTop);
        

    }
    else
    {
        rightTop = getColumnIndex(diagramProp, rel, i+1, entityRight, rightCol) + 10;
        
        x2 = diagramOffset[tableName2];
        createRelationSignLeft(ctx, x1, leftTop, sign);
        createRelationSignRight(ctx, x2, rightTop, sign);
        
        ctx.moveTo(x1+12, leftTop); 
        ctx.lineTo(x2-12, rightTop);
    }


    ctx.stroke();
    
}

function createRelationSignLeft(ctx, x1, leftTop, sign)
{
    if(sign == '>')
    {
        createRelationSignLeftMultiple(ctx, x1, leftTop, sign);
    }
    if(sign == '<' || sign == '-')
    {
        createRelationSignSingle(ctx, x1, leftTop, sign);
    }
}
function createRelationSignRight(ctx, x1, leftTop, sign)
{
    x1 = x1 - 12;
    if(sign == '<')
    {
        createRelationSignRightMultiple(ctx, x1, leftTop, sign);
    }
    if(sign == '>' || sign == '-')
    {
        createRelationSignSingle(ctx, x1, leftTop, sign);
    }
}
function createRelationSignLeftMultiple(ctx, x, y, sign)
{
    let x1 = x;
    let y1 = y - 4;
    let y2 = y1 + 4;
    let y3 = y1 + 8;
    let x2 = x1 + 8;
    let x3 = x1 + 12;
    
    ctx.beginPath();
    
    ctx.moveTo(x1, y1); 
    ctx.lineTo(x2, y2);
    
    ctx.moveTo(x1, y3); 
    ctx.lineTo(x2, y2);
    
    ctx.moveTo(x1, y2); 
    ctx.lineTo(x3, y2);
    
    ctx.moveTo(x2, y1); 
    ctx.lineTo(x2, y3);
    
    ctx.stroke();
}
function createRelationSignRightMultiple(ctx, x, y, sign)
{
    let x1 = x ;
    let y1 = y - 4;
    let y2 = y1 + 4;
    let y3 = y1 + 8;
    let x2 = x1 + 4;
    let x3 = x1 + 12;
    
    ctx.beginPath();
    
    ctx.moveTo(x2, y2); 
    ctx.lineTo(x3, y1);
    
    ctx.moveTo(x2, y2); 
    ctx.lineTo(x3, y3);
    
    ctx.moveTo(x1, y2); 
    ctx.lineTo(x3, y2);
    
    ctx.moveTo(x2, y1); 
    ctx.lineTo(x2, y3);
    
    ctx.stroke();
}
function createRelationSignSingle(ctx, x, y, sign)
{
    let x1 = x;
    let y1 = y - 4;
    let y2 = y1 + 4;
    let y3 = y1 + 8;
    let x2 = x1 + 6;
    let x3 = x1 + 12;
    
    ctx.beginPath();
    
    ctx.moveTo(x1, y2); 
    ctx.lineTo(x3, y2);
    
    ctx.moveTo(x2, y1); 
    ctx.lineTo(x2, y3);
    
    ctx.stroke();
}
function getColumnIndex(diagramProp, rel, i, entity, col)
{
    i = parseInt(i);
    let diagramTables = getTable(rel);
    if(col != null)
    {
        col = col.trim();
        let tableName = diagramTables[i];
        let info = tableList[tableName];
        if(typeof info != 'undefined')
        {
            for(let j in info.columns)
            {
                if(info.columns[j]['Column Name'] == col)
                {
                    return (parseInt(j) * diagramProp.columnHeight) + diagramProp.headerHeight + diagramProp.marginTop;
                }
            }
        }
    }
    return diagramProp.marginTop;
}
function getDimension(result, rel)
{
    let diagramTables = getTable(rel);

    let max = 0;
    for(let j = 0; j<result.length;j++)
    {
        let info = result[j];
        if(inArray(diagramTables, info.tableName))
        {
            if(max < info.columns.length)
            {
                max = info.columns.length;
            }
        }
    }
    let diagramProp = {};
    diagramProp.diagramWidth = 200;
    diagramProp.relationWidth = 50;
    diagramProp.columnHeight = 20;
    diagramProp.headerHeight = 30;
    diagramProp.marginLeft = 0;
    diagramProp.marginRight = 0;
    diagramProp.marginTop = 0;
    diagramProp.marginBottom = 0;
    
    let height = max * diagramProp.columnHeight + diagramProp.headerHeight + diagramProp.marginTop + diagramProp.marginBottom;
    let width = (diagramTables.length * diagramProp.diagramWidth) + ((diagramTables.length - 1) * diagramProp.relationWidth) + diagramProp.marginLeft + diagramProp.marginRight;
    return {diagramProp:diagramProp, width: width, height: height};
}

function inArray(haystack, needle)
{
    for(let i in haystack)
    {
        if(haystack[i] == needle)
        {
            return true;
        }
    }
    return false;
}

function createDiagram(ctx, diagramProp, rel, relationValue, i)
{
    let info = tableList[rel[i]];
    if(typeof info != 'undefined')
    {
        let x1 = (i * diagramProp.diagramWidth) + (i * diagramProp.relationWidth) + diagramProp.marginLeft;
        diagramOffset[info.tableName] = x1;
        let width = diagramProp.diagramWidth - 1;
        let y1 = diagramProp.marginTop;
        let height = (info.columns.length * diagramProp.columnHeight) + diagramProp.headerHeight;
        
        ctx.beginPath();
        ctx.strokeStyle = '#2669a4'; 

        ctx.rect(x1, y1, width, height-1);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.fillStyle = "#CAF4FF";
        ctx.fillRect(x1, y1, width, height-1);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.fillStyle = "#5AB2FF";
        ctx.fillRect(x1, y1, width, diagramProp.headerHeight - 1);
        ctx.stroke();

        
        ctx.beginPath();
        ctx.strokeStyle = '#b6cde1'; 
        ctx.fillStyle = "#444444";
        ctx.font = "12px Arial";
        ctx.fillText(info.tableName, x1 + 8, y1 + 18);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.font = "10px Arial";
        ctx.fillStyle = "#333333";
        
        for(let i in info.columns)
        {
            let x2 = x1 + 8;
            let y2 = y1 + diagramProp.headerHeight + (diagramProp.columnHeight * i) + 10;
            ctx.fillText(info.columns[i]['Column Name'], x2, y2+2);
            ctx.moveTo(x1, y2 - 11); 
            ctx.lineTo(x1+diagramProp.diagramWidth, y2 - 11);
        }
        
        ctx.stroke();
        return true;
    }
    return false;
}
function splitRel(arr, delimiter)
{
    let arr4 = [];
    for(let i in arr)
    {
        let arr2 = arr[i].split(delimiter);
        for(let j in arr2)
        {
            val = arr2[j].trim();
            if(val.length > 0)
            {
                arr4.push(val);
            }
        }
    }
    return arr4;
}

function createTable(info)
{
    let colwidth = [
        28,
        15,
        10,
        15,
        10,
        22
    ];
    let fieldName = [];
    
    let column = info.columns[0];
    for(let i in column)
    {
        if(column.hasOwnProperty(i))
        {
            fieldName.push(i);
        }
    }
    
    let table = document.createElement('table');
    table.setAttribute('width', '100%');
    table.setAttribute('border', '1');
    
    let thead = document.createElement('thead');
    let trh = document.createElement('tr');
    for(let i in fieldName)
    {
        let td = document.createElement('td');
        td.innerHTML = fieldName[i];
        td.style.width = colwidth[i] + '%';
        trh.appendChild(td);
    }
    
    thead.appendChild(trh);
    let tbody = document.createElement('tbody');
    
    
    for(let i = 0; i<info.columns.length;i++)
    {
        let trb = document.createElement('tr');
        let fieldName = info.columns[i];
        for(let j in fieldName)
        {
            let td = document.createElement('td');
            td.innerHTML = fieldName[j];
            trb.appendChild(td);
        }
        tbody.appendChild(trb);
    }
    
    table.appendChild(thead);
    table.appendChild(tbody);
    
    return table;
}
function clearResult()
{
    output.innerHTML = '';
}
function setResult(result)
{
    output.innerHTML = result;
}

window.onload = function()
{
    initAll();
}