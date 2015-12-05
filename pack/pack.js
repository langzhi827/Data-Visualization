(function (window, d3) {

    window.pack = function (elem, jsonPath, nests, key) {

        var diameter = parseInt(elem.style('width')); // 最大直径
        var margin = 10; // 内容距离容器的距离
        var padding = 2; // 同级圆之间的距离

        var pack = d3.layout.pack() // 用递归的圆-包生成一个层次布局。
            .padding(padding) // 指定布局间距（以像素为单位）
            .size([diameter - margin, diameter - margin]) // 指定布局尺寸。
            .value(function (d) { // 设置用于圆尺寸的值访问器。
                return d[key];
            });

        // 创建容器
        var svg = elem.append("svg")
            .attr("width", diameter)
            .attr("height", diameter)
            .append("g")
            .attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

        // 获取json数据
        d3.json(jsonPath, function (error, root) {
            if (error) throw error;

            var focus = root, // 设置当前缩放到焦点元素
                nodes = pack.nodes(root), // 计算包布局并返回节点数组
                view; // 当前缩放视图信息

            var circle = svg.selectAll("circle")
                .data(nodes)
                .enter().append("circle")
                .attr("class", function (d) {
                    // 无父节点说明是根，无子节点说明已经是最深
                    return d.parent ? d.children ? "pack-node" : "pack-node pack-node-leaf" : "pack-node pack-node-root";
                })
                .on("click", function (d) {
                    if (focus !== d) {
                        zoom(d);
                        d3.event.stopPropagation();
                    }
                });

            // 设置显示文本
            var text = svg.selectAll("text")
                .data(nodes)
                .enter().append("text")
                .attr("class", "pack-label")
                .style("display", function (d) {
                    // 默认显示根元素子集
                    return d.parent === root ? null : "none";
                })
                .text(function (d) { // 设置文本内容
                    return d[nests[d.depth - 1]] + '(' + key + '):' + d[key];
                });

            var node = svg.selectAll("circle,text");

            // 点击任何位置都缩放到默认（以根为焦点）大小
            elem.on("click", function () {
                zoom(root);
            });
            // (x,y) 圆心坐标，（root.r * 2 + margin） --> 盒子大小
            zoomTo([root.x, root.y, root.r * 2 + margin]);

            // 缩放
            function zoom(d) {
                focus = d;

                var transition = d3.transition() // 开启一个过渡动画
                    .duration(d3.event.altKey ? 7500 : 750) //指定每个元素的持续时间（以毫秒为单位） d3.event.altKey 是否按住ALT键
                    .tween("zoom", function (d) { // 指定一个自定义的补间操作符作为过渡的一部分运行
                        var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]); // interpolateZoom->在两个点之间平滑地缩放平移
                        return function (t) {
                            zoomTo(i(t));
                        };
                    });

                // 操作text显示
                // each --> 为过渡结束时间添加一个监听器
                transition.selectAll("text") // 为每个选中的元素在多个子元素开启一段过渡
                    .filter(function (d) {
                        return d.parent === focus || this.style.display === "inline";
                    })
                    .style("fill-opacity", function (d) {
                        return d.parent === focus ? 1 : 0;
                    })
                    .each("start", function (d) {
                        if (d.parent === focus) this.style.display = "inline";
                    })
                    .each("end", function (d) {
                        if (d.parent !== focus) this.style.display = "none";
                    });
            }

            function zoomTo(v) {
                var k = diameter / v[2]; // 缩放倍数
                view = v;
                node.attr("transform", function (d) { // 设置平移
                    return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")";
                });
                circle.attr("r", function (d) { // 设置半径大小
                    return d.r * k;
                });
            }
        });

    }

})(this, d3);