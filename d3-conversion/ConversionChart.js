function ConversionChart(opt) {
    opt = this.extend({}, opt);

    this.container = opt.element;

    this.option = opt;
    this.data = opt.data;
    this.step = opt.data.length;
    this.space = opt.space || 10; // 转化图间隔
    this.option.color = this.option.color || [['#289efc', '#2cfdfd']];
    this.chartOption = this.option.chart = this.extend({
        left: 0,
        top: 0,
        bottom: 20,
        labelDistance: 100,
        labelWidth: 60,
        leftLableFormatter: function (v) {
            return v + '%';
        },
        innerLableFormatter: function (v) {
            return v;
        },
        callback: function () {
        },
        minHeight: 30,
        maxHeight: 60,
        leftTitle: '',
        title: ''
    }, this.option.chart || {});

    this.init();
}

ConversionChart.prototype = {
    constructor: ConversionChart,
    /**
     * 初始化
     */
    init: function () {

        if (!this.data || !this.data.length) {
            return;
        }

        var width = this.container.clientWidth,
            height = this.container.clientHeight;

        // 处理顶部装饰
        this.option.chart.top += 60;

        // 单个转化图高度
        this.cHeight = (height - (this.step - 1) * this.space
            - this.option.chart.top
            - this.option.chart.bottom) / this.step;

        // 第一个转化图宽度，后续依次按占比计算
        this.cWidth = this.option.chart.width || width;

        // 最大数据值
        this.maxData = 0;
        for (var i = 0; i < this.step; i++) {
            this.maxData = Math.max(this.maxData, this.data[i].value);
        }


        this.svg = d3.select(this.container)
            .html('')
            .append('svg')
            .attr("width", width)
            .attr("height", height);

        this.defs = this.svg.append('defs');

        // 起始圆心坐标
        this.startCenter = [
            this.option.chart.left + this.option.chart.labelDistance + this.cWidth / 2,
            this.option.chart.top + this.cHeight / 2
        ];

        this.draw();

        this.drawUseless();
    },
    /**
     * 绘制入口
     */
    draw: function () {
        var self = this;

        self._index = self._index || 0;

        self.drawTitle();

        //增加步骤计数器 大于8步的不处理
        var stepCounter = 0;

        for (var i = 0; i < self.step; i++) {

            if (stepCounter < 8) {
                var color = self.option.color[i] || self.option.color[0];
                var linearType = 'horizontal';
                var colorId = 'color0';

                colorId = 'color' + self._index;
                var _t = Object.prototype.toString.call(color);
                if (_t == '[object Object]') {
                    linearType = color.type || linearType;
                    color = color.value;
                }

                var xyConfig = {
                    'horizontal': ['0%', '0%', '0%', '100%'],
                    'vertical': ['0%', '0%', '100%', '0%'],
                    'diagonal': ['0%', '100%', '100%', '0%']
                };

                var linear = this.defs.append('linearGradient')
                    .attr('id', colorId)
                    .attr('x1', xyConfig[linearType][0])
                    .attr('y1', xyConfig[linearType][1])
                    .attr('x2', xyConfig[linearType][2])
                    .attr('y2', xyConfig[linearType][3]);

                linear.append('stop')
                    .attr('offset', '0%')
                    .attr('stop-color', color[0])
                    .attr('stop-opacity', '1');

                linear.append('stop')
                    .attr('offset', '100%')
                    .attr('stop-color', color[1])
                    .attr('stop-opacity', '1');

                self._index++;

                var data = this.data[i];

                var ePosition = {
                    x: self.startCenter[0],
                    y: self.startCenter[1] + i * (self.cHeight + self.space),
                    rx: self.cWidth / 2 * data.value / self.maxData,
                    ry: self.cHeight / 2 * data.value / self.maxData
                };
                var _ry = Math.max(ePosition.ry, self.option.chart.minHeight / 2);
                _ry = Math.min(_ry, self.option.chart.maxHeight / 2);


                if (i == self.step - 1) {

                    var tmpRate = data.value / self.maxData;
                    if (tmpRate > 0.5) {  //如果比例超过一半,则考虑减小绘制的底图大小.
                        ePosition.ry = _ry * 0.7;
                        //ePosition.rx = ePosition.rx * Math.min(Math.abs(1-Math.abs(1-tmpRate)), 0.6);
                    } else {
                        ePosition.ry = _ry;
                    }

                    self.drawLastUseless(ePosition);
                }

                var ellipse = this.svg.append("ellipse")
                    .attr('cx', ePosition.x)
                    .attr('cy', ePosition.y)
                    .attr('rx', ePosition.rx)
                    .attr('ry', _ry)
                    .attr('fill-opacity', 0.6)
                    .attr('fill', 'url(#' + colorId + ')');

                // lable
                this.drawLabel(ePosition, data, self.cWidth / 2 - ePosition.rx);

                // 文本
                var innerLableFormatter = this.option.chart.innerLableFormatter;
                var _text = typeof innerLableFormatter == 'function' ? innerLableFormatter(data.value) : data.value;
                var text = this.svg.append("text")
                    .attr("x", self.startCenter[0])
                    .attr("y", self.startCenter[1] + i * (self.cHeight + self.space) + 5)
                    .attr("fill", '#ffffff')
                    .attr("text-anchor", 'middle')
                    .attr("font-size", '18px')
                    .text(_text);

                // 箭头
                if (i > 0) {
                    var aPos = {
                        x: self.startCenter[0],
                        y: self.startCenter[1] + (i - 0.5) * (self.cHeight + self.space)
                    };
                    self.drawArrow({
                        x: aPos.x - 7.5,
                        y: aPos.y,
                        color: self._preColor[0]
                    });

                    // arrow lable
                    this.drawArrowLabel(aPos, (data.value / this.data[i - 1].value * 100).toFixed(2), ePosition.rx);
                }

                if (typeof this.option.chart.callback == 'function') {
                    this.option.chart.callback(data, {
                        height: self.cHeight,
                        index: i,
                        space: self.space
                    });
                }

                self._preColor = color;
            } else {
                break;
            }

            //步骤加一
            stepCounter += 1;
        }
    },
    /**
     * title
     */
    drawTitle: function () {
        if (this.chartOption.title) {
            this.svg.append("text")
                .attr("x", this.startCenter[0])
                .attr("y", 20)
                .attr("fill", '#289efc')
                .attr("text-anchor", 'middle')
                .attr("font-size", '18px')
                .text(this.chartOption.title);
        }

        if (this.chartOption.leftTitle) {
            this.svg.append("text")
                .attr("x", this.chartOption.left)
                .attr("y", this.startCenter[1] - this.cHeight / 2)
                .attr("fill", '#289efc')
                .attr("font-size", '18px')
                .text(this.chartOption.leftTitle);
        }
    },
    /**
     * label
     */
    drawLabel: function (params, data, add) {

        var distance = this.option.chart.labelDistance;
        this.drawLine([params.x + params.rx, params.y], [params.x + params.rx + distance + add, params.y]);
    },
    /**
     * arrow label
     */
    drawArrowLabel: function (params, data, add) {

        var left = this.option.chart.left;

        var leftLableFormatter = this.option.chart.leftLableFormatter;
        var text = typeof leftLableFormatter == 'function' ? leftLableFormatter(data) : data;

        this.svg.append('text')
            .attr("x", left)
            .attr("y", params.y + 15)
            .attr("fill", '#ffffff')
            //.attr("text-anchor", 'bottom')
            .attr("font-size", '16px')
            .text(text);

        this.drawLine([left + this.option.chart.labelWidth, params.y + 10], [params.x - add, params.y + 10]);
    },
    /**
     * 参考线
     */
    drawLine: function (start, end) {
        this.svg.append("line")
            .attr("x1", start[0])
            .attr("y1", start[1])
            .attr("x2", end[0])
            .attr("y2", end[1])
            .attr("stroke", '#184d82')
            .attr('stroke-dasharray', '4,4')
            .attr("stroke-width", 1);
    },
    /**
     * 绘制箭头
     * @param setting
     */
    drawArrow: function (setting) {
        this._arrowIndex = this._arrowIndex || 0;
        var id = 'markerArrow' + this._arrowIndex;
        var marker = this.defs.append('marker')
            .attr('id', id)
            .attr('markerWidth', '20')
            .attr('markerHeight', '20')
            .attr('refx', '0')
            .attr('refy', '0')
            .attr('orient', 'auto');

        marker.append('path')
            .attr('d', 'M3,0 L13,0 L13,10 L16,10 L8,20 L0,10 L3,10 L3,0')
            .attr('fill', setting.color);

        this.svg.append("line")
            .attr("x1", setting.x)
            .attr("y1", setting.y)
            .attr("x2", setting.x)
            .attr("y2", setting.y)
            .attr("stroke-width", 1)
            .attr("marker-start", "url(#" + id + ")");

        this._arrowIndex++;
    },
    /**
     * 对象合并
     * @param obj1
     * @param obj2
     * @returns {*}
     */
    extend: function (obj1, obj2) {
        for (var k in obj2) {
            obj1[k] = obj2[k];
        }
        return obj1;
    },
    /**
     * 装饰品
     */
    drawUseless: function () {
        this.svg.append("circle")
            .attr("cx", this.startCenter[0])
            .attr("cy", 30)
            .attr("r", 5)
            .style("fill", '#22a6a8');

        this.svg.append("line")
            .attr("x1", this.startCenter[0])
            .attr("y1", 30)
            .attr("x2", this.startCenter[0])
            .attr("y2", this.startCenter[1] - 10)
            .attr("stroke", '#26d2d7')
            .attr('stroke-dasharray', '2,4')
            .attr('stroke-opacity', 0.5)
            .attr("stroke-width", 1);

        this.svg.append("ellipse")
            .attr('cx', this.startCenter[0])
            .attr('cy', this.startCenter[1] - this.cHeight / 2)
            .attr('rx', this.cWidth / 3)
            .attr('ry', 16)
            .attr('fill', 'transparent')
            .attr('stroke-dasharray', '1,3')
            .attr('stroke', '#26d2d7');

        this.svg.append("ellipse")
            .attr('cx', this.startCenter[0])
            .attr('cy', this.startCenter[1] - this.cHeight / 2)
            .attr('rx', this.cWidth / 5)
            .attr('ry', 8)
            .attr('fill', 'transparent')
            .attr('stroke-width', 6)
            .attr('stroke-opacity', 0.8)
            .attr('stroke', 'url(#color0)');

    },
    /**
     * last 装饰品
     * @param params
     */
    drawLastUseless: function (params) {
        var svg = this.svg;

        svg.append("ellipse")
            .attr('cx', params.x)
            .attr('cy', params.y)
            .attr('rx', params.rx * 1.5)
            .attr('ry', params.ry * 1.5)
            .attr('fill', 'transparent')
            .attr('stroke-width', 1)
            .attr('stroke-opacity', 0.4)
            .attr('stroke', '#1ca9dd');

        var ps = [];
        var baseAngle = 45;
        for (var i = 0; i < 8; i++) {
            var angle = baseAngle * i + 45;
            var p = {
                x: Math.round(params.x + params.rx * 1.5 * Math.cos(angle * Math.PI / 180)),
                y: Math.round(params.y + params.ry * 1.5 * Math.sin(angle * Math.PI / 180))
            };

            if (p.y != Math.round(params.y)) {
                ps.push(p);
            }
        }

        ps.forEach(function (p, i) {
            var end = ps[i + 1] || ps[0];
            var w = ps[i + Math.ceil(ps.length / 2)];

            svg.append("line")
                .attr("x1", p.x)
                .attr("y1", p.y)
                .attr("x2", end.x)
                .attr("y2", end.y)
                .attr("stroke", '#1ca9dd')
                .attr('stroke-opacity', 0.4)
                .attr("stroke-width", 1);

            if (w) {
                svg.append("line")
                    .attr("x1", p.x)
                    .attr("y1", p.y)
                    .attr("x2", w.x)
                    .attr("y2", w.y)
                    .attr("stroke", '#1ca9dd')
                    .attr('stroke-opacity', 0.2)
                    .attr("stroke-width", 1);
            }

        });
    }
};