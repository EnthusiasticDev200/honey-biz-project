import discount from '../../utils/discountFunction.js'



describe("discount function", ()=>{
    it('should return no discount if totalAmount is below lower limit', ()=>{
        const payment = discount(50000)
        expect(payment).toMatch(/No discount/)
    })
    it('should return discount 2% if totalAmount is within 78k-89k', ()=>{
        const payment = discount(80000)
        expect(payment).toMatch(/Discount 2%/)
    })
    it("should return discount 2.5% if totalAmount is within 89001-100001", ()=>{
        const payment = discount(90000)
        expect(payment).toMatch(/Discount 3%/)
    })
    it("should return discount 4% if totlAmount is within 120k", ()=>{
        const payment = discount(122000)
        expect(payment).toMatch(/Discount 4%/)
    })
    it('should return discount percentage for a given amount', ()=>{
        const firstAmount = discount(90000)
        const secondAmount = discount(150000)
        expect(firstAmount).not.toEqual(secondAmount)
    })










})