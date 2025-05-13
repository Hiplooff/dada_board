{message.imageData && (
  <div className="mt-4">
    <img
      src={message.imageData}
      alt="Message attachment"
      className="max-w-full h-auto"
      loading="lazy"
    />
  </div>
)} 