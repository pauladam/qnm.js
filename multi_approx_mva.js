
// Simple implementation of a multi class approximate mean value analysis solver in
// JS. See chapter 7 of Quantitative System Performance for original algorithm
// http://www.cs.washington.edu/homes/lazowska/qsp/Images/Chap_07.pdf

var inspect = require('sys').inspect;

// TODO: Move to module
// Some utilities
var keys = function(_obj){
  var _keys = [];
  for(k in _obj){ if(_obj.hasOwnProperty(k)){ _keys.push(k); } }
  return _keys;
}

// abstraction for double nested loops
var doubleListIterator = function(list1, list2, f){
  list1.forEach(function(c, i){
    list2.forEach(function(k, j){
      f(c,k,i,j);
    });
  });
}

var partial = function(f, list1, list2){
  return function(nf){
    f(list1, list2, nf);
  }
}

var print = function(){ console.log(Array.prototype.slice.call(arguments)[0]); }

var sum = function(list){
  var _sum = 0;
  list.forEach(function(el, i){
    _sum += el;
  });
  return _sum;
}

// Class inputs
var classInfo = {
  
  a : {
        numCustomers : 1,
        queueServerDemands : [1, 3]
      },

  b : {
        numCustomers : 1,
        queueServerDemands : [2 , 4]
      }
}

// General inputs
var tolerance = 0.001,
    numCenters = 2,
    delta = 999;

var classes = keys(classInfo),
    centers = [1, 2]; // cpu, disk

var demand = {},
    average = {},
    iteration = 0,
    qLengths = {},
    throughput = {},
    residenceTime = {};

var ckIterator = partial(doubleListIterator, classes, centers);

// expand demand hash
ckIterator(function(c, k){
  demand[[c,k]] = classInfo[c]['queueServerDemands'][k-1];
});

// 1, initialize queue lengths with initial guess
ckIterator(function(c,k){
  var Nc = classInfo[c]['numCustomers'];
  qLengths[[c,k]] = Nc / numCenters;
});

// start optimization loop
while(delta > tolerance){

  var newQLengths = {},
      residenceTimeSum = {};

  // 2, estimate approximate queue lengths : A[(c,k)]
  ckIterator(function(c,k){

    var qlenVals = [],
        Nc = classInfo[c]['numCustomers'],

        right = 0,
        left = ( (Nc - 1) / Nc ) * qLengths[[c,k]];

    classes.forEach(function(j, i){
      if(j != c){ qlenVals.push( qLengths[[j,k]] ); }
    });

    right = sum(qlenVals);

    average[[c,k]] = left + right;

  });

  // using equations 7.1, 7.2, 7.3 to estimate new network values

  // 7.3 residence time
  ckIterator(function(c,k){
    residenceTime[[c,k]] = demand[[c,k]] * (1 + average[[c,k]])
    var RcSum = residenceTimeSum[c] || 0;
    residenceTimeSum[c] = (residenceTimeSum[c] || 0) + residenceTime[[c,k]]
  });


  // 7.1 throughput
  classes.forEach(function(c, i){
    var Nc = classInfo[c]['numCustomers'], // num customers for c
        rsum = 0;

    centers.forEach(function(k, j){
      rsum += residenceTime[[c,k]];
    });

    throughput[c] = Nc / rsum;

  });

  // 7.2 queue lengths
  ckIterator(function(c,k){
    newQLengths[[c,k]] = throughput[c] * residenceTime[[c,k]];
  });

  // reckon iteration delta

  // alternative delta reckoning method (max of differeneces) finishes earlier
  // so prefer method given below (sum of differences)

  var diffs = [];
  ckIterator(function(c,k){
    diffs.push( Math.abs( qLengths[[c,k]] - newQLengths[[c,k]] ) )
  });
  delta = sum(diffs);

  console.log('iteration: %s', iteration);
  console.log('queue lengths: \n%s', inspect(qLengths));
  console.log('throughput: \n%s', inspect(throughput));
  console.log('residence time: \n%s', inspect(residenceTime));
  console.log('residence time[c]: \n%s\n', inspect(residenceTimeSum));
  console.log('delta: %s', delta);
  print('');

  iteration += 1;
  qLengths = newQLengths;

}
