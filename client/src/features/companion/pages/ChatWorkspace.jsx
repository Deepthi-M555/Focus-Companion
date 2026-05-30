import MainLayout
from "../../../components/layout/MainLayout";

function ChatWorkspace() {

  return (

    <MainLayout>

      <div className="chat-page">

        <div className="messages">

        </div>

        <div className="chat-input">

          <input
            placeholder="Talk to FYNIX..."
          />

        </div>

      </div>

    </MainLayout>

  );

}

export default ChatWorkspace;