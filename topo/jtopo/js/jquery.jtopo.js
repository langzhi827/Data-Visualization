$.fn.topo = function (opt) {
    var config = {
        status: {
            0: 'gray',
            1: 'red',
            2: 'yel',
            3: 'green'
        },
        node: {
            width: 90,
            height: 55,
            left: 250,
            top: 160
        }
    };
    return this.each(function () {
        var details = opt.data.details;
        var relations = opt.data.relations;
        var maxNode = opt.data.maxNode;
        var topo_data = {};
        var curr_node_name = null;

        /*设置canvas高度*/
        $(this).attr('height', (maxNode * config.node.top + config.node.height - 35));
        //设置宽度,最小1000
        var width = $(this).parent().width();
        if (width < 1000) {
            width = 1000;
            $(this).parent().width(1000);
        }
        $(this).attr('width', width);
        var a = $(this).clone();
        $(this).after(a).remove();

        /*利用jtopo插件画图*/
        var canvas = $(a)[0];
        var stage = new JTopo.Stage(canvas);// 创建一个舞台对象
        var scene = new JTopo.Scene(stage);// 创建一个场景对象
        scene.background = opt.imgUrl + '/bg.jpg';

        function newNode(layer, left, top) {
            var name = layer.response_time ? layer.name + '(' + layer.response_time + ')' : layer.name;
            var node = new JTopo.Node(name);
            node.setBound(left, top, config.node.width, config.node.height);
            node.setImage(opt.imgUrl + '/' + layer.type + '_' + config.status[layer.status] + '.png');

            node.textPosition = 'Bottom_Center';
            node.textOffsetY = 10;
            node.font = '15px 微软雅黑'; // 文字
            node.fontColor = '47,47,47';
            //node.dragable = false;
            if (layer.number) {
                node.alarm = ' ' + layer.number + ' ';
                node.alarmFont = '12px 微软雅黑';
                node.alarmColor = '29,187,243';
                node.alarmAlpha = 1;
            }
            if (opt.self_field && !node[opt.self_field]) {
                node[opt.self_field] = layer[opt.self_field] || 0;
            }
            node.topo_node_name = layer.link_name;
            if (opt.click) {
                var handle = function () {
                    if (opt.except) {
                        var swit = false;
                        for (var i = 0, l = opt.except.length; i < l; i++) {
                            if (topo_data.data_node[opt.except[i]] == this) {
                                swit = true;
                            }
                        }
                        if (swit) {
                            return false;
                        }
                    }

                    curr_node_name = this.topo_node_name;
                    for (var n in topo_data.data_node) {
                        topo_data.data_node[n].selected = false;
                    }
                    topo_data.data_node[curr_node_name].selected = true;
                    opt.click.call(this);
                }
                node.click(handle);
            }

            scene.add(node);

            topo_data.data_node = topo_data.data_node || {};
            topo_data.data_node[layer.link_name] = node;

            return node;
        }

        function newLink(start, end, text) {
            var link = new JTopo.Link(start, end, text);
            link.lineWidth = 2; // 线宽
            link.textOffsetY = 0; // 文本偏移量（向下3个像素）
            link.strokeColor = '181,181,181';
            link.arrowsRadius = 8; //箭头大小
            scene.add(link);

            return link;
        }

        var length = 0;
        for (var key in details) {
            if ($(details[key]).length == 0) {
                delete details[key];
            } else {
                length++;
            }
        }
        var index = 0;

        for (var key in details) {
            var layer = details[key];

            var len = layer.length;
            for (var i = 0; i < len; i++) {
                //计算图表自适应
                if (index == 0) {
                    var left = 50;   //默认左边距50
                } else {
                    var left = width / length * index + 50;
                }
                var top = (config.node.top * i + 60 + (maxNode - len) / 2 * (config.node.top));
                newNode(layer[i], left, top);
            }
            index++;
        }
        for (var i = 0, l = relations.length; i < l; i++) {
            if (relations[i].throughput != '' && relations[i].response_time != '') {
                newLink(topo_data.data_node[relations[i].start], topo_data.data_node[relations[i].end], relations[i].throughput + ',' + relations[i].response_time);
            } else if (relations[i].throughput == '' && relations[i].response_time != '') {
                newLink(topo_data.data_node[relations[i].start], topo_data.data_node[relations[i].end], relations[i].response_time);
            } else if (relations[i].throughput != '' && relations[i].response_time == '') {
                newLink(topo_data.data_node[relations[i].start], topo_data.data_node[relations[i].end], relations[i].throughput);
            } else {
                newLink(topo_data.data_node[relations[i].start], topo_data.data_node[relations[i].end]);
            }
        }
        if (opt.link_name && topo_data.data_node[opt.link_name]) {
            //topo_data.data_node[opt.link_name].selected = true;
            topo_data.data_node[opt.link_name].click();
        }
        if (opt.except) {
            for (var i = 0, l = opt.except.length; i < l; i++) {
                var node = topo_data.data_node[opt.except[i]];
                if (!$.isEmptyObject(node)) {
                    node.showSelected = false; // 不显示选中矩形
                }

            }
        }

        stage.click(function () {
            topo_data.data_node[curr_node_name].selected = true;
        });

    });
}