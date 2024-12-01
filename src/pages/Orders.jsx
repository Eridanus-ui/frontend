import React, { useContext, useEffect, useRef, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import axios from "axios";
import toast from "react-hot-toast";
import Spinner from "./../components/Spinner";
import Modal from "../components/Modal";
import { Copy } from "lucide-react";
import InfoMessage from "../components/InfoComponent";

export default function Orders() {
  // <------Import Context Variables----->
  const { backendUrl, token } = useContext(ShopContext);

  // <------------State Variables------------>
  const [orderData, setOrderData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [sendingData, setSendingData] = useState(false);
  const [selectedItem, setSelectedItem] = useState({});
  const [currentItem, setCurrentItem] = useState(selectedItem);
  const [action, setAction] = useState(null);

  // <------------Handle Side Effects------------>
  useEffect(() => {
    fetchData();
  }, [token]);

  useEffect(() => {
    if (currentItem._id) {
      setSelectedItem(orderData.find((item) => item._id === currentItem._id));
    }
  }, [orderData]);

  // <------------Custom Functions------------>
  const handleTrackOrder = async (e, item) => {
    //Function to track orders
    setAction("track_order");
    setCurrentItem(item);
    setSendingData(true);
    e.preventDefault();
    setOpenModal(true);
    await loadOrderData();
    setSelectedItem(item);
    setSendingData(false);
  };

  // Load Order Data
  const loadOrderData = async () => {
    try {
      if (!token) {
        return null;
      }
      const response = await axios.post(
        backendUrl + "/api/order/userorders",
        {},
        { headers: { token } }
      );

      if (response.data.success) {
        setOrderData(response.data.orders.reverse());
      }
      setLoading(false);
    } catch (error) {
      console.log(error);
      toast.error(error.message);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // Proceed to Complete Stalled Purchases
  const completePurchases = async () => {
    if (selectedItem) {
      try {
        const orderId = selectedItem._id;
        const checkoutRequestId = selectedItem.checkoutRequestId;

        const response = await axios.post(
          backendUrl + "/api/order/confirmpayment",
          { orderId, checkoutRequestId },
          { headers: { token } }
        );

        console.log(response.data);
      } catch (error) {
        console.error("Completing Payment:", error);
      }
    }
  };

  const completePurchasesConfirmation = async (e, order) => {
    setSelectedItem(order);
    setAction("complete_payment");
    e.preventDefault();
    console.log(order);
    setOpenModal(true);
  };

  // <--------------Cancel/Delete Item-------------->
  const cancelOrder = async (orderId) => {
    setLoading(true);
    try {
      const response = await axios.post(
        backendUrl + "/api/order/cancelorder",
        { orderId },
        { headers: { token } }
      );

      if (response.data.success) {
        if (response.data.status) {
          toast.error(response.data.message);
          return setTimeout(async () => {
            await fetchData();
          }, 1500);
        }
        await fetchData();
      } else {
        console.warn("Unexpected response:", response.data.message);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "An error occurred";
      console.error("Error deleting item:", errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await loadOrderData();
    setLoading(false);
  };

  return (
    <div className="border-t pt-16 bg-white">
      <div className="text-2xl">
        <Title text1={"MY"} tex2={"ORDERS"} />
      </div>
      <div className="">
        {loading ? (
          <>
            <Spinner />
          </>
        ) : orderData.length === 0 ? (
          <>
            <div className="flex justify-center items-center">
              <InfoMessage
                title={"Nothing Here!"}
                message={"Please make some orders!"}
              />
            </div>
          </>
        ) : (
          <>
            <>
              <div className="space-y-6">
                {orderData.map((order, index) => (
                  <div
                    key={index}
                    className="p-6 border rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 font-yantramanav font-semibold ">
                          ID:{" "}
                          <span className="font-muktaVaani">{order._id}</span>
                        </p>
                        <p className="text-sm text-gray-500 font-yantramanav">
                          Placed on {new Date(order.date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500 font-yantramanav">
                          Payment Method: {order.paymentMethod.toUpperCase()}
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-medium font-yantramanav ${
                          order.status === "Delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "Shipped"
                            ? "bg-blue-100 text-blue-800"
                            : order.status === "Packing"
                            ? "bg-orange-100 text-orange-600"
                            : order.status === "Pending"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {order.status}
                      </div>
                    </div>

                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-4 py-4 border-b last:border-b-0"
                      >
                        <img
                          src={item.image[0]}
                          alt={item.name}
                          className="w-20 h-28 object-cover aspect-auto rounded-md"
                        />
                        <div className="flex-1 space-y-2">
                          <p className="font-medium text-gray-700 line-clamp-1 font-muktaVaani">
                            {item.name}
                          </p>
                          <div className="flex items-center text-sm text-gray-500 font-yantramanav">
                            <p>Qty: {item.quantity}</p>
                            <span className="mx-2">•</span>
                            <p>Size: {item.size}</p>
                            <span className="mx-2">•</span>
                            <p>KSH {item.price.toLocaleString()}</p>
                          </div>
                          <p className="text-sm text-gray-500 font-imprima line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-between items-start pt-4">
                      <div className="space-y-1 ">
                        <p className="font-medium text-gray-800 font-muktaVaani">
                          Delivery Details:
                        </p>
                        <p className="text-sm text-gray-500 font-yantramanav">
                          {order.address.firstName} {order.address.lastName}
                        </p>
                        <p className="text-sm text-gray-500 font-yantramanav">
                          {order.address.phone}
                        </p>
                        <p className="text-sm text-gray-500 font-yantramanav">
                          {order.address.email}
                        </p>
                        <p className="text-sm text-gray-500 font-yantramanav">
                          {order.address.street}
                        </p>
                        <p className="text-sm text-gray-500 font-yantramanav">
                          {order.address.city}, {order.address.county}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 font-muktaVaani">
                          Total Amount:
                        </p>
                        <p className="text-lg font-medium text-gray-800">
                          KSH {order.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500 font-yantramanav mt-1">
                          Payment Status: {order.payment ? "Paid" : "Pending"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 justify-end">
                      {order.status === "Delivered" ? (
                        <button
                          onClick={() => {
                            toast.error("Feature Not Implemented", {
                              id: "Feature Not Implemented",
                            });
                          }}
                          className="border bg-blue-100 px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-gray-200 text-gray-700 cursor-pointer"
                        >
                          Apply For Refund
                        </button>
                      ) : (
                        <button
                          disabled={
                            loading ||
                            order.payment ||
                            order.status !== "Pending"
                          }
                          onClick={() => cancelOrder(order._id)}
                          className={`border px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                            loading ||
                            order.status !== "Pending" ||
                            order.payment
                              ? "opacity-50 cursor-not-allowed bg-gray-100"
                              : "hover:bg-gray-200 bg-white text-gray-700 cursor-pointer"
                          }`}
                        >
                          Cancel Order
                        </button>
                      )}

                      {!order.payment ? (
                        <button
                          onClick={(e) =>
                            completePurchasesConfirmation(e, order)
                          }
                          className="bg-blue-600 text-white px-4 py-2 text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Pay Now (KSH {order.amount.toLocaleString()})
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleTrackOrder(e, order)}
                          className="border px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-200 bg-white text-gray-700 transition-colors"
                        >
                          Track Order
                        </button>
                      )}
                    </div>

                    {order.status === "Delivered" && order.payment && (
                      <div className="flex justify-end">
                        {" "}
                        <button
                          onClick={() => handleWriteReview(order)}
                          className="mt-4 bg-gray-900 text-white px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
                        >
                          Write a Review
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          </>
        )}
      </div>

      <div className="">
        {action === "track_order" ? (
          <>
            <Modal
              button2={"Close"}
              title={"Order Tracking"}
              isOpen={openModal}
              onClose={() => setOpenModal(false)}
              onSubmitHandler={handleTrackOrder}
              buttonsVisible={false}
            >
              {sendingData ? (
                <div className="h-48 flex justify-center items-center">
                  <Spinner />
                </div>
              ) : (
                <>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex flex-col">
                        <div className="">
                          <p className="text-base text-gray-500 font-yantramanav font">
                            {selectedItem.status === "Delivered"
                              ? "Delivered to"
                              : "Deliverying to"}
                            : {selectedItem.address.firstName}{" "}
                            {selectedItem.address.lastName}
                          </p>
                        </div>
                      </div>
                      <div className="flex">
                        <p className="text-base text-gray-500 font-yantramanav">
                          Order ID : {selectedItem._id}
                        </p>
                        <Copy
                          className="w-5 ml-2 cursor-pointer"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedItem._id);
                            toast.success("ID copied!", {
                              id: selectedItem._id,
                            });
                          }}
                        />
                      </div>
                      <p className="text-base text-gray-500 font-yantramanav font">
                        Delivery Info : {selectedItem.status}
                      </p>

                      <div className="flex justify-center items-center pt-3">
                        <InfoMessage
                          message={
                            selectedItem.status === "Delivered"
                              ? "Succesfully Delivered"
                              : "We will notify you on text and email immediately after dispatch."
                          }
                          type={
                            selectedItem.status === "Delivered"
                              ? "success"
                              : "info"
                          }
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </Modal>
          </>
        ) : action === "complete_payment" ? (
          <>
            <Modal
              button1={"Pay Now"}
              button2={"Close"}
              title={"Complete Payment!"}
              isOpen={openModal}
              onClose={() => setOpenModal(false)}
              onSubmitHandler={completePurchases}
            >
              <>
                <div className="space-y-6">
                  <p className="text-base text-gray-500 font-muktaVaani">
                    Hello,{" "}
                    {selectedItem.address.firstName +
                      " " +
                      selectedItem.address.lastName}
                    .
                  </p>
                  <p className="text-base text-gray-500 font-imprima">
                    Please confirm Payment of{" "}
                    <span className="font-semibold">
                      Ksh. {selectedItem.amount}
                    </span>{" "}
                    to Eridanus Mall. You'll receive a prompt on your phone to
                    the number{" "}
                    <span className="bg-slate-300 p-[1px] px-1 rounded-md font-medium">
                      {selectedItem.address.phone}
                    </span>
                    . Kindly enter your PIN and wait for confirmation after
                    payment.
                  </p>
                </div>
              </>
            </Modal>
          </>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}
