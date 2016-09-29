(function (window, $) {

    function TsbGraph(elem, data) {
        this.elem = elem;
        this.data = data;

        this.min = data.time_range[0];
        this.max = data.time_range[1];

        this.count = 8;
        this.space = 100 / this.count;

        this.padding = 10;

    }

    TsbGraph.prototype.init = function () {

        var _self = this;

        var graph = $('<div class="tsb-graph"></div>');

        var scale = _self.buildScale();
        var ticks = scale.ticks;
        var lines = scale.lines;

        var container = $('<div class="graph-container"></div>');

        var index = _self.buildIndex();

        container.append(index);

        var i = 0;
        for (var key in _self.data.tree) {
            var group = _self.buildTrance(key, _self.data.tree[key], i);
            container.append(group);
            i++;
        }

        graph.append(ticks);
        graph.append(lines);
        graph.append(container);

        _self.elem.append(graph);

        return _self;
    }

    /**
     * 生成刻度尺
     * @returns {{ticks: *, lines: *}}
     */
    TsbGraph.prototype.buildScale = function () {
        var _self = this;
        //生成刻度值
        function getInterval(min, max, count) {
            var intervals = [0];

            var range = max - min;
            var part = Math.ceil(range / count);

            for (var i = 1; i < count + 1; i++) {
                intervals.push(min + part * i);
            }

            //重新设置max值
            _self.max = intervals[intervals.length - 1];

            return intervals;
        }

        //生成刻度
        function makeTick(intervals, space) {
            var ticks = '<div class="graph-scale">';
            for (var i = 0, l = intervals.length; i < l; i++) {
                ticks += '<div class="graph-number" style="left: ' + space * (i - 0.5) + '%;">' + intervals[i] + '</div>';
            }
            ticks += '</div>';

            return $(ticks);
        }

        //生成刻度线
        function makeLine(intervals, space) {
            var lines = '<div class="graph-lines">';
            for (var i = 0, l = intervals.length; i < l; i++) {
                lines += '<div class="graph-line" style="left: ' + space * i + '%;"></div>';
            }
            lines += '</div>';

            return $(lines);
        }

        var intervals = getInterval(_self.min, _self.max, _self.count);

        return {
            ticks: makeTick(intervals, _self.space),
            lines: makeLine(intervals, _self.space)
        };
    }
    /**
     * 生成指标数据
     * @returns {*|HTMLElement}
     */
    TsbGraph.prototype.buildIndex = function () {

        var _self = this;

        var item_key = {
            CPU: ['cpu_average', 'current_cpu'],
            Memory: ['memory_average', 'current_memory']
        };
        //生成cpu和memory项目
        function makeItem(title) {

            var average = _self.data[item_key[title][0]];
            var current_data = _self.data[item_key[title][1]];

            var item = $('<div class="graph-item">' +
                '<div class="graph-item-label">' +
                '<div class="graph-item-title">' + title + '</div>' +
                '<div class="graph-item-data">' +
                '<div class="graph-item-key">平均</div>' +
                '<div class="graph-item-value">' + average + '</div>' +
                '</div>' +
                '</div>' +
                '<div class="graph-item-place"></div>' +
                '</div>');

            var place = item.find('.graph-item-place');

            var start = _self.min;

            for (var time in current_data) {
                var info = {
                    start: start,
                    end: time,
                    value: current_data[time]
                };
                var width = (time - start) / _self.max * 100 + '%';
                var left = start / _self.max * 100 + '%';

                var progress = $('<div class="graph-index-progress graph-orange" style="width: ' + width + ';left: ' + left + ';"></div>');

                progress.data('graph_info', info);

                place.append(progress);

                start = time;

            }

            return item;

        }

        var group = $('<div class="graph-group"></div>');
        var title = $('<div class="graph-title">指标</div>');

        var cpu = makeItem('CPU');
        var memory = makeItem('Memory');

        group.append(title);
        group.append(cpu);
        group.append(memory);

        return group;

    }

    TsbGraph.prototype.buildTrance = function (title, data, index) {
        var _self = this,
            padding = _self.padding * index;

        var group = $('<div class="graph-group"></div>');
        var title = $('<div class="graph-title">' + title + '</div>');

        group.append(title);

        for (var i = 0, l = data.length; i < l; i++) {
            var width = data[i].duration / _self.max * 100 + '%';
            var left = data[i].start_time / _self.max * 100 + '%';

            var item = $('<div class="graph-item">' +
                '<div class="graph-item-label">' +
                '<div class="graph-item-title" style="padding-left:' + padding + 'px;">' + data[i].name + '</div>' +
                '</div>' +
                '<div class="graph-item-place">' +
                '<div class="graph-trace-progress graph-blue" style="width: ' + width + ';left:' + left + ';"></div>' +
                '</div>' +
                '</div>');

            item.data('graph_info', data[i]);

            group.append(item);
        }


        return group;

    }

    window.tsbGraph = {
        init: function (elem, data) {
            return new TsbGraph(elem, data).init();
        }
    };

})(this, jQuery);