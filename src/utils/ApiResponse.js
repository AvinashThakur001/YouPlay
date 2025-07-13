class ApiResponse{
    constructor(statusCode , message , data ){
        this.success = statusCode < 400;
        this.message = message;
        this.data = data;
        this.statusCode = statusCode
    }
}
export {ApiResponse};