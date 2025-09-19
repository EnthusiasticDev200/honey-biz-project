
const discount = totalAmount =>{
    let lowerPriceLimit = 78000 // discount eligibility
    let midPriceRange = 11000
    let discountPercentage = 0.02

    while(true){ // priceRange exist
      let upperPriceLimit = lowerPriceLimit + midPriceRange //89,000

      if(totalAmount >= lowerPriceLimit && totalAmount <= upperPriceLimit){
        return `${Math.round(totalAmount-(totalAmount * discountPercentage))}`
      }
      // no priceRange
      if(totalAmount < lowerPriceLimit){
        return `${totalAmount}`
      }

    //next priceRange
    lowerPriceLimit = upperPriceLimit + 1 //  becomes 89001, upper=100,001

    discountPercentage += 0.005 // new incremented discountPrice 
    }

    
}



export default discount