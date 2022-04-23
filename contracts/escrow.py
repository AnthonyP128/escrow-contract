from pyteal import *

def escrow_program():
    caller = Txn.sender() == App.globalGet(Bytes("ADMIN")) # The address that pays the fee
    amount = Btoi(Txn.application_args[1])  # Converts the Bytes to Integer of the value of key-value pair
    receiver = Txn.sender() # The address that pays for the amount

    deploy = Seq([
        App.globalPut(Bytes("ADMIN"), Txn.application_args[0]), # The address of the admin, by getting the first application argument
        Approve(),
    ])

    transfer = Seq([
        Assert(caller), # Checks if caller is true
        InnerTxnBuilder.Begin(), #  Begins the inner transactions
        InnerTxnBuilder.SetFields({ # Creates the field of the inner transaction
            TxnField.type_enum: TxnType.Payment,
            TxnField.amount: amount,
            TxnField.receiver: receiver,
            }),
        InnerTxnBuilder.Submit(), # Submit the inner transaction
        Approve(),
    ])

    on_call_method = Txn.application_args[0] # checks the params of the call_application if true calls the transfer method
    contract_interface = Cond(
        [on_call_method == Bytes("transfer"), transfer], 
    )

    program = Cond (  
        [Txn.application_id() == Int(0), deploy],
        [Txn.on_completion() == OnComplete.NoOp, contract_interface],
    )

    return program

def clear_program():
    return Approve()

if __name__ == "__main__":
    with open("escrow.teal", "w") as f:
        compiled = compileTeal(escrow_program(), mode=Mode.Application, version=5)
        f.write(compiled)
    with open("clear.teal", "w") as f:
        compiled = compileTeal(clear_program(), mode=Mode.Application, version=5)
        f.write(compiled)