import java.awt.geom.Point2D;
import java.util.HashMap;
import java.util.Map;

import com.change_vision.jude.api.inf.AstahAPI;
import com.change_vision.jude.api.inf.editor.TransactionManager;
import com.change_vision.jude.api.inf.model.IDiagram;
import com.change_vision.jude.api.inf.model.INamedElement;
import com.change_vision.jude.api.inf.presentation.INodePresentation;
import com.change_vision.jude.api.inf.presentation.IPresentation;
import com.change_vision.jude.api.inf.project.ProjectAccessor;


public class AdjustFinalRegisterDiagram {
    public static void main(String[] args) throws Exception {
        ProjectAccessor accessor = AstahAPI.getAstahAPI().getProjectAccessor();
        accessor.open(args[0]);
        TransactionManager.beginTransaction();
        for (INamedElement element : accessor.findElements(IDiagram.class)) {
            IDiagram diagram = (IDiagram) element;
            if (!diagram.getName().contains("UC Đăng ký tài khoản")) continue;
            Map<String, INodePresentation> nodes = new HashMap<>();
            for (IPresentation presentation : diagram.getPresentations()) {
                if ("Class".equals(presentation.getType())
                    && presentation.getModel() instanceof INamedElement) {
                    nodes.put(((INamedElement) presentation.getModel()).getName(),
                        (INodePresentation) presentation);
                }
            }
            place(nodes.get("RegisterScreen"), 40, 200, 350, 215);
            place(nodes.get("RegisterController"), 470, 225, 340, 135);
            place(nodes.get("AuthService"), 900, 190, 370, 175);
            place(nodes.get("User"), 1380, 55, 300, 160);
            place(nodes.get("Customer"), 1380, 400, 300, 145);
        }
        TransactionManager.endTransaction();
        accessor.save();
        accessor.close();
    }

    private static void place(
        INodePresentation node, double x, double y, double width, double height
    ) throws Exception {
        node.setProperty("notation_type", "normal");
        node.setProperty("auto_resize", "false");
        node.setLocation(new Point2D.Double(x, y));
        node.setWidth(width);
        node.setHeight(height);
    }
}
