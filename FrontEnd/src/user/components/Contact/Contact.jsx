import React, { useState } from 'react';
const Contact = () => {
const [emailContact, setEmailContact] = useState('');
  const [contentContact, setContentContact] = useState('');
  const [message, setMessage] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    const newContacts = {
      emailContact,
      contentContact,
    };
    setMessage('Gửi liên hệ thành công');
    fetch('/save-contact', {
		method: 'POST',
		headers: {
		  'Content-Type': 'application/json',
		},
		body: JSON.stringify(newContacts),
	  })
	  .then((response) => {
		if (!response.ok) {
		  throw new Error('Network response was not ok');
		}
		return response.json();
	  })
	  .then((data) => {
		console.log('Success:', data);
		setMessage('Gửi liên hệ thành công');
	  })
	  .catch((error) => {
		console.error('Error:', error);
		setMessage('Có lỗi xảy ra, vui lòng thử lại.');
	  });
	  setEmailContact('');
	  setContentContact('');
	};
    return (
        <div>

    <section className="bg-img1 txt-center p-lr-15 p-tb-92" style={{ backgroundImage: `url('assets/images/bg-01.jpg')` }}>
    <h2 class="ltext-105 cl0 txt-center">
			Liên hệ
		</h2>
	</section>	


	<section class="bg0 p-t-104 p-b-116">
		<div class="container">
			<div class="flex-w flex-tr">
				<div class="size-210 bor10 p-lr-70 p-t-55 p-b-70 p-lr-15-lg w-full-md">
				<form onSubmit={handleSubmit}>
                <h4 className="text-center text-success">{message}</h4>
                <h4 className="mtext-105 cl2 txt-center p-b-30">Gửi tin nhắn cho chúng tôi</h4>
                <div className="bor8 m-b-20 how-pos4-parent">
                  <input
                    className="stext-111 cl2 plh3 size-116 p-l-62 p-r-30"
                    type="email"
                    value={emailContact}
                    onChange={(e) => setEmailContact(e.target.value)}
                    required
                    placeholder="Địa chỉ email của bạn"
                  />
                  <img className="how-pos4 pointer-none" src="assets/images/icons/icon-email.png" alt="ICON" />
                </div>
                <div className="bor8 m-b-30">
                  <textarea
                    className="stext-111 cl2 plh3 size-120 p-lr-28 p-tb-25"
                    name="msg"
                    value={contentContact}
                    onChange={(e) => setContentContact(e.target.value)}
                    required
                    placeholder="Làm thế nào chúng ta có thể giúp đỡ?"
                  />
                </div>
                <button type="submit" className="flex-c-m stext-101 cl0 size-121 bg3 bor1 hov-btn3 p-lr-15 trans-04 pointer">
                  Gửi Liên Hệ
                </button>
    </form>
				</div>

				<div class="size-210 bor10 flex-w flex-col-m p-lr-93 p-tb-30 p-lr-15-lg w-full-md">
					<div class="flex-w w-full p-b-42">
						<span class="fs-18 cl5 txt-center size-211">
							<span class="lnr lnr-map-marker"></span>
						</span>

						<div class="size-212 p-t-2">
							<span class="mtext-110 cl2">
							Địa chỉ
							</span>

							<p class="stext-115 cl6 size-213 p-t-18">
								Coza Store Center 8th floor, 379 Hudson St, New York, NY 10018 US
							</p>
						</div>
					</div>

					<div class="flex-w w-full p-b-42">
						<span class="fs-18 cl5 txt-center size-211">
							<span class="lnr lnr-phone-handset"></span>
						</span>

						<div class="size-212 p-t-2">
							<span class="mtext-110 cl2">
							Hãy nói chuyện							</span>

							<p class="stext-115 cl1 size-213 p-t-18">
								+1 800 1236879
							</p>
						</div>
					</div>

					<div class="flex-w w-full">
						<span class="fs-18 cl5 txt-center size-211">
							<span class="lnr lnr-envelope"></span>
						</span>

						<div class="size-212 p-t-2">
							<span class="mtext-110 cl2">
							Hỗ trợ bán hàng							</span>

							<p class="stext-115 cl1 size-213 p-t-18">
								contact@example.com
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>	
	<div class="btn-back-to-top" id="myBtn">
		<span class="symbol-btn-back-to-top">
			<i class="zmdi zmdi-chevron-up"></i>
		</span>
	</div>
        </div>
    );
};

export default Contact;