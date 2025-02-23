const User = require('../models/Users')
const Address = require('../models/Address')
// create address controller

exports.createAddress = async (req, res) => {
    try {
        const userId = req.user.id
        const { Name,
           
            streetAddress,
            city,
            state,
            zipCode,
            mobile } = req.body


        // const existingAddress = await Address.findOne({ userId })

        const newAddress = new Address({
            Name,
          
            userId,
            streetAddress,
            city,
            state,
            zipCode,
            mobile

        })
        // add in user model
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        user.address.push(newAddress._id);
        await user.save();
        await newAddress.save()
        res.json({ msg: "Address created successfully" })


    } catch (error) {
        console.error(error.message)
        res.status(500).send("Server error")
    }
}

// get all addresses

exports.getAllAddresses = async (req, res) => {
    try {
        const userId = req.user.id

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const addresses = await Address.find({ userId });

        res.json(addresses)

    } catch (error) {
        console.error(error.message)
        res.status(500).send("Server error")
    }
}

// delete address by id

exports.deleteAddress = async (req, res) => {
    try {
        const userId = req.user.id
        const addressId = req.params.id

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const address = await Address.findByIdAndDelete(addressId);
        if (!address) {
            return res.status(404).json({ message: "Address not found." });
        }
        // remove from user also
        user.address.pull(addressId);
        await user.save();
        res.json({ msg: "Address deleted successfully" })


    } catch (error) {
        console.error(error.message)
        res.status(500).send("Server error")
    }
}