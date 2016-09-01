dc.gaugeChart = function (parent, chartGroup) {
  var _chart = dc.capMixin(dc.colorMixin(dc.baseMixin({})));

  var _minAngle = -90;
  var _maxAngle = 90;
  var _range;
  var _cx;
  var _cy;
  var _radius;
  var _innerRadius;
  var _g;
  var _renderLabel = false;
  var _sliceCssClass = 'pie-slice';
  var _emptyCssClass = 'empty-chart';
  
  function deg2rad(deg) {
    return deg * Math.PI / 180;
  }

  _chart.legendables = function () {
    return _chart.data().map(function (d, i) {
      var legendable = {
        name: d.key, 
        data: d.value, 
        others: d.others, 
        chart:_chart,
        color: _chart.getColor(d, i)
      };
      return legendable;
    }).reverse();
  };
  
  _chart._doRender = function () {
    _chart.resetSvg();

    _g = _chart.svg()
      .append('g')
      .attr('transform', 'translate(' + _chart.cx() + ',' + _chart.cy() + ')');

    drawChart();

    return _chart;
  };

  _chart._doRedraw = function () {
    drawChart();
    return _chart;
  };

  /**
  #### .cx([cx])
  Get or set center x coordinate position. Default is center of svg.
  **/
  _chart.cx = function (cx) {
    if (!arguments.length) return (_cx ||  (_chart.width()) / 2 );
    
    _cx = cx;
    return _chart;
  };

  /**
  #### .cy([cy])
  Get or set center y coordinate position. Default is center of svg.

  **/
  _chart.cy = function (cy) {
    if (!arguments.length) return (_cy ||  _chart.height());
    
    _cy = cy;
    return _chart;
  };

  /**
  #### .renderLabel(boolean)
  Turn on/off label rendering
  **/
  _chart.renderLabel = function (_) {
    if (!arguments.length) return _renderLabel;

    _renderLabel = _;
    return _chart;
  };

  /**
  #### .radius([radius])
  Get or set the outer radius. If the radius is not set, it will be half of the minimum of the
  chart width and height.
  **/
  _chart.radius = function (r) {
    if (!arguments.length) return _radius;
    
    _radius = r;
    return _chart;
  };

  /**
  #### .innerRadius([radius])
  Get or set the inner radius. If the inner radius is not set, it will be half the radius.
  **/
  _chart.innerRadius = function (r) {
      if (!arguments.length) {
          return _innerRadius;
      }
      _innerRadius = r;
      return _chart;
  };

  function onClick(d, i) {
    if (_g.attr('class') !== _emptyCssClass) _chart.onClick(d.data, i);
  }

  function buildArcs() {
    return d3.svg.arc().outerRadius(_radius)
                       .innerRadius(_innerRadius);
  }

  function isOffCanvas(current) {
    return !current || isNaN(current.startAngle) || isNaN(current.endAngle);
  }

  function tweenPie(b) {
    b.innerRadius = _innerRadius;
    var current = this._current;
    
    if (isOffCanvas(current)) current = {startAngle: 0, endAngle: 0};
    
    var i = d3.interpolate(current, b);
    this._current = i(0);
    
    return function (t) {
      return safeArc(i(t), 0, buildArcs());
    };
  }

  function safeArc(d, i, arc) {
    var path = arc(d, i);
    if (path.indexOf('NaN') >= 0) path = 'M0,0';
    
    return path;
  }

  function createElements(slices, arc, pieData) {
    var slicesEnter = createSliceNodes(slices);

    createSlicePath(slicesEnter, arc);
  }

  function createSliceNodes(slices) {
    var slicesEnter = slices
                        .enter()
                        .append('g')
                        .attr('class', function (d, i) {
                            return _sliceCssClass + ' _' + i;
                        });
    return slicesEnter;
  }

  function createSlicePath(slicesEnter, arc) {
    var slicePath = slicesEnter.append('path')
                               .attr('fill', fill)
                               .on('click', onClick)
                               .attr('d', function (d, i) {
                                 return safeArc(d, i, arc);
                               });

    dc.transition(slicePath, _chart.transitionDuration(), function (s) {
      s.attrTween('d', tweenPie);
    });
  }

  function createLabels(slicesEnter, pieData, arc) {
    if (_chart.renderLabel()) {
      _chart.svg().selectAll('.label').remove();
      
      var lg = _chart
                  .svg()
                  .append('g')
                  .attr('class', 'label')
                  .attr('transform', function () {
                      return 'translate(' + (_chart.cx()-_radius) + ',' + 
                                            (_chart.cy() + 15) +')';
                  })
                  .selectAll('text')
                  .data([pieData[0].data.key,pieData[pieData.length-1].data.key]);

      lg.exit().remove();

      lg.enter()
        .append('text')
        .attr('transform', function(d,i) {
            return !i ? 'translate(0,0)' : 'translate('+ 2*_radius + ',0)';
        })
        .attr('text-anchor', function(d,i) {
            return i ? 'end' : 'start';
        })
        .text(function(d){
            return d;
        });
    }
  }

  function updateElements(pieData, arc) {
      updateSlicePaths(pieData, arc);
  }

  function updateSlicePaths(pieData, arc) {
    var slicePaths = _g.selectAll('g.' + _sliceCssClass)
                          .data(pieData)
                          .select('path')
                          .attr('d', function (d, i) {
                              return safeArc(d, i, arc);
                          });
    dc.transition(slicePaths, _chart.transitionDuration(), function (s) {
                      s.attrTween('d', tweenPie);
                  }).attr('fill', fill);
  }

  function updateLabels(pieData, arc) {
    if (_chart.renderLabel())
      var labels = _g.selectAll('text.' + _sliceCssClass).data(pieData);
  }

  function removeElements(slices) {
    slices.exit().remove();
  }

  function fill(d, i) {
    return _chart.getColor(d.data, i);
  }

  function gaugeLayout (data) {
    var values = data.map(function(j) {
      return j.value;
    });
    
    var init_values = [0];
    
    values.forEach(function(v,i){
      init_values.push(v+init_values[i]);
    });
    
    var arcs = init_values.map(function(e){    
      return e/init_values[init_values.length-1];
    });
    
    var _range = _maxAngle - _minAngle;
      
    return data.map(function(e, i) {
      return {
        data: e,
        value: e.value,
        startAngle: deg2rad(_minAngle + (arcs[i] * _range)),
        endAngle: deg2rad(_minAngle + (arcs[i+1] * _range))
      };
    });
  }

  function drawChart() {
    // set radius on basis of chart dimension if missing
    _radius = _radius ? _radius : d3.min([_chart.width()/2, _chart.height()]);
        _innerRadius = _innerRadius ? _innerRadius : _radius * 0.5;

    var arc = buildArcs();

    var data_to_gauge;

    if (_chart.hasFilter()) {
        data_to_gauge = [];
        _chart.data().forEach(function (e) {
          if (_chart.hasFilter(e.key))
            data_to_gauge.push(e);
        });
    } else
        data_to_gauge = _chart.data();

    var gaugeData = gaugeLayout(data_to_gauge);

    if (_g) {
        var slices = _g.selectAll('g.' + _sliceCssClass).data(gaugeData);

        createElements(slices, arc, gaugeData);

        updateElements(gaugeData, arc);

        removeElements(slices);
    }
  } 
  
  return _chart.anchor(parent, chartGroup);
};
