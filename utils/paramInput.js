

const positiveIntParam = (input) =>{
    const value = Number(input) 
    if(!Number.isInteger(value) || value <=0){
        throw new error ('Input must be a positive ineger')
    }
    return value
}

export default positiveIntParam
