import joi from "joi"; 
export const validateMessage = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().required().valid("message", "private_message"),
});
export const validateParticipant =  joi.object({
    name: joi.string().required()
})