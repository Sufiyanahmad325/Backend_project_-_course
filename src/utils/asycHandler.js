const asycncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((error) => next(error))
    }
}

export { asycncHandler }



/* second way
const asycncHandler1 = (fn) => async(req,res, next)=>{
        try {
            await fn(req,res,next)
        } catch (error) {
            res.status(error.code || 500).json({
                success:true,
                message:error.message
            })
        }
}
*/