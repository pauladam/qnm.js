// Simple implementation of a single class exact mean value analysis solver in
// JS. See Appendix A of Quantitative System Performance for original algorithm

var exactMva = function(numCenters, numCustomers, thinkTime, demand){

  var resTimes     = [];
      queueLengths = [], 

      systemRes    = 0, // system residence time
      throughput   = 0;

  // zero out arrays
  for(var i=0;i <= numCenters; i++){ resTimes[i] = queueLengths[i] = 0; }

  // accomodate for one-based indexing in algorithm
  demand.unshift(0);

  // notice that algorithm is index one-based
  for(var n=1; n <= numCustomers; n++){

    systemRes = 0;

    for(var center=1; center <= numCenters; center++){
      resTimes[center] = demand[center] * (1.0 + queueLengths[center]);
      systemRes += resTimes[center];
    }

    var residenceSum = 0;
    for(var k=1;k<=numCenters;k++){
      residenceSum += resTimes[k];
    }
    throughput = n / (thinkTime + residenceSum)

    for(var center=1;center <= numCenters;center++){
      queueLengths[center] = resTimes[center] * throughput
    }
    
  }

  // print the results
  console.log('\nSystem throughput: %s', throughput);
  console.log('System response time: %s\n', (numCustomers / throughput) - thinkTime);

  console.log('Device utilizations: ');
  for(var center=1; center <= numCenters; center++){
    console.log('center: %s, %s', center, throughput * demand[center]);
  }

  console.log('\nDevice queue lengths');
  for(var center=1; center <= numCenters; center++){
    console.log('center: %s, %s', center, queueLengths[center]);
  }

  console.log('\nDevice residence times: ');
  for(var center=1; center <= numCenters;center++){
    console.log('center: %s, %s', center, resTimes[center]);
  }

}

var numCenters = 3,
    numCustomers = 3,
    thinkTime = 15, 
    demand = [0.605, 2.1, 1.35];

exactMva(numCenters, numCustomers, thinkTime, demand);
