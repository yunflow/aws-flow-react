import UnityViewer from "../components/UnityViewer"

function ARPage() {
    return (
        <div id="ar-page">
            <UnityViewer folder={"arapp"} project={"arapp"} />
        </div>
    );
}

export default ARPage;