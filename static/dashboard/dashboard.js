'use strict';

function processCollection(collection) {
    $('#data').append('<h1>' + collection.collection + '</h1>');
    if (collection.data) {
        $('#data').append('<div id="' + collection.collection + '-data" />');
        collection.data.forEach(function(query, idx) {
            processData(collection, query, idx);
        });
    }
}

function processData(collection, query, idx) {
    switch (query.type) {
        case 'date':
          processDateData(collection, query, idx);
          break;
        case 'discrete':
          processDiscreteData(collection, query, idx);
          break;
        default:
          break;
      }
}

function processDateData(collection, query, idx) {
    const collectionData = $('#' + collection.collection + '-data');
    const id = collection.collection + '-' + idx;
    collectionData.append('<h2>' + query.name + '</h2>');
    collectionData.append('<svg class="chart ' + id + '" />');
    
    var margin = {top: 20, right: 30, bottom: 30, left: 40},
        width = (query.data.length * 25) - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

    var x = d3.scaleBand()
        .rangeRound([0, width]);

    var y = d3.scaleLinear()
        .range([height, 0]);

    var chart = d3.select('.' + id)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    x.domain(query.data.map(function(d) { return d._id; }));
    y.domain([0, d3.max(query.data, function(d) { return d.num; })]);
    
    chart.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    chart.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y))
        .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Frequency");

    chart.selectAll(".bar")
        .data(query.data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d._id); })
        .attr("y", function(d) { return y(d.num); })
        .attr("height", function(d) { return height - y(d.num); })
        .attr("width", x.bandwidth());
}

function processDiscreteData(collection, query, idx) {
    const collectionData = $('#' + collection.collection + '-data');
    const id = collection.collection + '-' + idx;
    collectionData.append('<h2>' + query.name + '</h2>');
    collectionData.append('<svg class="chart ' + id + '" />');
    
    var margin = {top: 20, right: 30, bottom: 30, left: 40},
        width = 400 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

    var x = d3.scaleBand()
        .rangeRound([0, width]);

    var y = d3.scaleLinear()
        .range([height, 0]);

    var chart = d3.select('.' + id)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    x.domain(query.data.map(function(d) { return d._id; }));
    y.domain([0, d3.max(query.data, function(d) { return d.num; })]);
    
    // X Axis Ticks
    chart.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Y Axis Ticks
    chart.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y))
        .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Frequency");

    // Bars
    chart.selectAll(".bar")
        .data(query.data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d._id); })
        .attr("y", function(d) { return y(d.num); })
        .attr("height", function(d) { return height - y(d.num); })
        .attr("width", x.bandwidth());
}

$(function () {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = "/";
        return
    }

    $.ajax({
        method: 'GET',
        url: '/user/me/analytics',
        dataType: 'json',
        headers: {
            Authorization: 'Bearer ' + token,
        },
        success: function(data, status) {
            data.forEach(processCollection);
        }
    })
});
