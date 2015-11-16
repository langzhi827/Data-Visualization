(function (global, factory) {

    if (typeof module !== 'undefined' && typeof module.exports === 'object') {
        module.exports = factory;
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(function () {
            return factory;
        });
    } else {
        global.GeoPath = factory;
    }


})(typeof window !== "undefined" ? window : this, function (window) {

    /**
     * 让阿拉斯加地区在地图右侧显示(调整俄罗斯东部到地图右侧与俄罗斯相连)
     * @param p
     * @returns {*[]}
     */
    function formatPoint(p) {
        var x = p[0],
            y = p[1];
        return [(x < -168.5 ? x + 360 : x) + 170, 90 - y];
    }

    /**
     * 合并两个对象
     * @param target
     * @param source
     * @returns {*}
     * @private
     */
    function extend(target, source) {

        for (key in source) {
            if (source[key] !== undefined) {
                if (typeof source[key] == 'object') {
                    extend(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
        return target;
    }

    var convertor_parse = {
        xmin: 360,
        xmax: 0,
        ymin: 180,
        ymax: 0,
        /**
         * 过滤设置x&y的最大值和最小值
         * @param p
         */
        makePoint: function (p) {
            var self = this,
                point = formatPoint(p),
                x = point[0],
                y = point[1];

            if (self.xmin > x) {
                self.xmin = x;
            }
            if (self.xmax < x) {
                self.xmax = x;
            }
            if (self.ymin > y) {
                self.ymin = y;
            }
            if (self.ymax < y) {
                self.ymax = y;
            }
        },
        Point: function (coordinates) {
            this.makePoint(coordinates);
        },
        LineString: function (coordinates) {
            for (var i = 0, len = coordinates.length; i < len; i++) {
                this.makePoint(coordinates[i]);
            }
        },
        Polygon: function (coordinates) {
            for (var i = 0, len = coordinates.length; i < len; i++) {
                this.LineString(coordinates[i]);
            }
        },
        MultiPoint: function (coordinates) {
            for (var i = 0, len = coordinates.length; i < len; i++) {
                this.Point(coordinates[i]);
            }
        },
        MultiLineString: function (coordinates) {
            for (var i = 0, len = coordinates.length; i < len; i++) {
                this.LineString(coordinates[i]);
            }
        },
        MultiPolygon: function (coordinates) {
            for (var i = 0, len = coordinates.length; i < len; i++) {
                this.Polygon(coordinates[i]);
            }
        }
    };

    /**
     * 计算geoJson的srcSize属性
     * @param geo_json
     * @returns {*}
     * @private
     */
    function _parseSrcSize(geo_json) {
        var shapes = geo_json.features;

        function _pushApath(gm) {
            var shapeType = gm.type;
            var shapeCoordinates = gm.coordinates;

            convertor_parse[shapeType](shapeCoordinates);
        }

        for (var i = 0, len = shapes.length; i < len; i++) {
            var shape = shapes[i];
            if (shape.type == 'Feature') {
                _pushApath(shape.geometry);
            } else if (shape.type = 'GeometryCollection') {
                var geometries = shape.geometries;
                for (var j = 0, len2 = geometries.length; j < len2; j++) {
                    var val = geometries[j];
                    _pushApath(val);
                }
            }
        }

        geo_json.srcSize = {
            left: convertor_parse.xmin.toFixed(4) - 0,
            top: convertor_parse.ymin.toFixed(4) - 0,
            width: (convertor_parse.xmax - convertor_parse.xmin).toFixed(4) - 0,
            height: (convertor_parse.ymax - convertor_parse.ymin).toFixed(4) - 0
        };

        return geo_json;

    }

    var convertor = {
        makePoint: function (p) {
            var self = this,
                point = formatPoint(p),
                x = (point[0] - self.offset.x) * self.scale.x + self.offset.left,
                y = (point[1] - self.offset.y) * self.scale.y + self.offset.top;
            return [x, y];
        },
        Point: function (coordinates) {
            coordinates = this.makePoint(coordinates);
            return coordinates.join(',');
        },
        LineString: function (coordinates) {
            var str = '',
                self = this;

            for (var i = 0, len = coordinates.length; i < len; i++) {
                var point = self.makePoint(coordinates[i]);
                if (i == 0) {
                    str = 'M' + point.join(',');
                } else {
                    str = str + 'L' + point.join(',');
                }
            }
            return str;
        },
        Polygon: function (coordinates) {
            var str = '';

            for (var i = 0, len = coordinates.length; i < len; i++) {
                str = str + this.LineString(coordinates[i]) + 'z';
            }
            return str;
        },
        MultiPoint: function (coordinates) {
            var arr = [];
            for (i = 0, len = coordinates.length; i < len; i++) {
                arr.push(this.Point(coordinates[i]));
            }
            return arr;
        },
        MultiLineString: function (coordinates) {
            var str = '';
            for (var i = 0, len = coordinates.length; i < len; i++) {
                str += this.LineString(coordinates[i]);
            }
            return str;
        },
        MultiPolygon: function (coordinates) {
            var str = '';
            for (var i = 0, len = coordinates.length; i < len; i++) {
                str += this.Polygon(coordinates[i]);
            }
            return str;
        }
    };

    /**
     * 根据geoJson数据生成paths
     * @param geo_json
     * @param config  {width: 0, height: 0, offset: {left: 0, top: 0}}
     * @returns {Array}
     */
    function geo2path(geo_json, config) {

        // geo_json不存在srcSize
        if (!geo_json.srcSize) {
            _parseSrcSize(geo_json);
        }

        config = extend({
            height: 100,
            width: 100,
            offset: {
                left: 0,
                top: 0
            }
        }, config);
        /**
         * 地图偏移量
         */
        convertor.offset = {
            x: geo_json.srcSize.left,
            y: geo_json.srcSize.top,
            left: config.offset.left,
            top: config.offset.top
        };
        /**
         * 地图缩放比例
         */
        var scalx = config.width / geo_json.srcSize.width,
            scaly = config.height / geo_json.srcSize.height;
        scalx > scaly ? scalx = scaly : scaly = scalx;
        // scalx = scaly * 0.73;
        convertor.scale = {
            x: scalx,
            y: scaly
        };

        var pathArray = [],
            shapes = geo_json.features;

        for (var i = 0, len = shapes.length; i < len; i++) {
            var shape = shapes[i];
            if (shape.type == 'Feature') {
                _pushApath(shape.geometry, shape);
            } else if (shape.type = 'GeometryCollection') {
                var geometries = shape.geometries;
                for (var j = 0, len2 = geometries.length; j < len2; j++) {
                    var val = geometries[j];
                    _pushApath(val, val);
                }
            }
        }

        function _pushApath(gm, shape) {
            var shapeType = gm.type;
            var shapeCoordinates = gm.coordinates;
            var str = convertor[shapeType](shapeCoordinates);
            pathArray.push({
                type: shapeType,
                path: str,
                properties: shape.properties,
                id: shape.id
            });
        }

        return pathArray;

    }

    /**
     * 经纬度转坐标
     * @param p
     * @returns {*}
     */
    function geo2pos(p) {
        if (p instanceof Array) {
            return convertor.makePoint([p[0] - 0, p[1] - 0])
        } else {
            return convertor.makePoint([p.x - 0, p.y - 0])
        }
    }

    return {
        geo2path: geo2path,
        geo2pos: geo2pos
    };


}());
