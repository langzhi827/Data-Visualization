define('drawMap', [
    'zrender',
    'zrender/shape/Path',
    'zrender/shape/Text',
    'zrender/shape/Circle',
    '/js/geopath',
    '/js/mapGeoJson/world_geo',
    '/js/mapGeoJson/china_geo'
], function (zrender, PathShape, TextShape, CircleShape, GeoPath, world_geo, china_geo) {
    //某些地区文字标识偏移量
    var map_revise = {
        //'南海诸岛' : [32, 83],
        // 全国
        '广东': [0, -10],
        '香港': [10, 10],
        '澳门': [-10, 18],
        '黑龙江': [0, 20],
        //'北京': [-10, 0],
        '天津': [5, 5],
        // 广东
        '深圳市': [-35, 0],
        // 云南
        '红河哈尼族彝族自治州': [0, 20],
        '楚雄彝族自治州': [-5, 15],
        // 新疆
        '石河子市': [-5, 5],
        '五家渠市': [0, -10],
        '昌吉回族自治州': [10, 10],
        // 海南
        '昌江黎族自治县': [0, 20],
        '陵水黎族自治县': [0, 20],
        '东方市': [0, 20],
        // 陕西
        '渭南市': [0, 20]
    };
    //某些地区经纬度坐标，优先计算
    var map_coor = {
        'Russia': [ 100, 60 ],
        'United States of America': [ -99, 38 ]
    }


    var elem = document.getElementById('map');
    var zr = zrender.init(elem);


    /**
     * 创建path对象
     * @param p
     * @returns {PathShape}
     */
    function buildPath(p) {
        var option = {
            info: {
                id: p.id,
                properties: p.properties,
                path: p.path
            },
            position: [0, 0],
            style: {
                path: p.path,
                brushType: 'fill',
                color: '#c1c1c1'
                /*text: p.properties.name,
                 textColor: 'transparent',
                 textPosition: 'inside',
                 x: 0,
                 y: 0*/
            },
            highlightStyle: {
                lineWidth: 0,
                color: 'rgb(125,136,204)',
                textColor: '#000000'
            },
            clickable: true
        };

        var shape = new PathShape(option);

//        console.log(shape.getRect(shape.style));

        shape.bind('click', function (params) {
            console.log(params.target.info);
            console.log(zr);
        });

        shape.bind('mouseover', function (params) {
            // 解决hover某区域文字或者其他标识被遮盖
            params.target.info.mark.forEach(function (shape) {
                zr.addHoverShape(shape);
            });

        });

        shape.bind('mouseout', function (params) {

        });

        shape.bind('mousewheel', function (params) {
            console.log('mousewheel');
        });

        return shape;
    }

    /**
     * 获取地区文字标识的坐标
     * @param path
     * @returns {*}
     */
    function getCoorPos(path) {
        var pos,
            revise = map_revise[path.info.properties.name] || [0, 0];

        if (path.info.properties.cp) {
            pos = [GeoPath.geo2pos(path.info.properties.cp)[0] + revise[0],
                    GeoPath.geo2pos(path.info.properties.cp)[1] + revise[1]];
        } else {
            var box_info = path.getRect(path.style);
            pos = map_coor[path.info.properties.name]
                ? GeoPath.geo2pos(map_coor[path.info.properties.name]) :
                [box_info.x + box_info.width / 2, box_info.y + box_info.height / 2];
        }
        return pos;
    }

    /**
     * 根据path生成其对应文字标识
     * @param path
     * @returns {TextShape}
     */
    function buildText(path) {

        var coorPos = getCoorPos(path);

        var text = new TextShape({
//            info: path.info,
//            invisible: true,
            style: {
                brushType: 'fill',
                text: path.info.properties.name,
                x: coorPos[0],
                y: coorPos[1],
                textFont: '12px Arial',
                color: 'orange',
                textAlign: 'center'
            },
            highlightStyle: {
                strokeColor: 'transparent',
                shadowBlur: 0
            },
            clickable: true
        });

        text.bind('click', function (params) {
            console.log(params);
        });

        return text;
    }

    /**
     *  根据path生成标识形状
     * @param path
     * @returns {CircleShape}
     */
    function buildCircle(path) {

        var coorPos = getCoorPos(path);

        var circle = new CircleShape({
//            zlevel: 0,
//            z: 5,
            style: {
                x: coorPos[0],
                y: coorPos[1] - 12,
                r: 3,
                color: 'blue'
            },
            highlightStyle: {
                strokeColor: 'transparent'
            },
            hoverable: false
        });

        return circle;
    }

    var paths = GeoPath.geo2path(china_geo, {width: elem.clientWidth, height: elem.clientHeight, offset: {top: 0}});

    paths.forEach(function (p) {

        var path = buildPath(p);
        zr.addShape(path);

        path.info.mark = path.info.mark || [];

        var text = buildText(path);
        path.info.mark.push(text);

        var circle = buildCircle(path);
        path.info.mark.push(circle);

        zr.addShape(circle);
        zr.addShape(text);


    });

    //设置拖动和缩放
    zr.modLayer(0, {
        zoomable: true,
        panable: true
    });


});