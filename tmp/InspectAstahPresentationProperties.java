import java.util.Map;

import com.change_vision.jude.api.inf.AstahAPI;
import com.change_vision.jude.api.inf.model.IDiagram;
import com.change_vision.jude.api.inf.model.IDependency;
import com.change_vision.jude.api.inf.model.INamedElement;
import com.change_vision.jude.api.inf.model.IPackage;
import com.change_vision.jude.api.inf.presentation.IPresentation;
import com.change_vision.jude.api.inf.presentation.ILinkPresentation;
import com.change_vision.jude.api.inf.project.ProjectAccessor;


public class InspectAstahPresentationProperties {
    private static void inspectPackage(IPackage pkg) throws Exception {
        for (INamedElement element : pkg.getOwnedElements()) {
            if (element instanceof IDiagram) {
                IDiagram diagram = (IDiagram) element;
                System.out.println("DIAGRAM: " + diagram.getName());
                for (IPresentation presentation : diagram.getPresentations()) {
                    if (presentation.getModel() != null
                        && presentation.getModel() instanceof INamedElement) {
                        String name = ((INamedElement) presentation.getModel()).getName();
                        if (name.matches("RegisterScreen|MedicalRecordScreen|User|Customer")) {
                            System.out.println("NODE: " + name + " type=" + presentation.getType());
                            for (Object entryObject : presentation.getProperties().entrySet()) {
                                Map.Entry<?, ?> entry = (Map.Entry<?, ?>) entryObject;
                                System.out.println("  " + entry.getKey() + "=" + entry.getValue());
                            }
                        }
                    }
                }
            }
            if (element instanceof IPackage) {
                inspectPackage((IPackage) element);
            }
        }
    }

    public static void main(String[] args) throws Exception {
        ProjectAccessor accessor = AstahAPI.getAstahAPI().getProjectAccessor();
        accessor.open(args[0]);
        for (INamedElement element : accessor.findElements(IDiagram.class)) {
            IDiagram diagram = (IDiagram) element;
            System.out.println("DIAGRAM: " + diagram.getName());
            for (IPresentation presentation : diagram.getPresentations()) {
                if (presentation instanceof ILinkPresentation
                    && presentation.getModel() instanceof IDependency) {
                    IDependency dependency = (IDependency) presentation.getModel();
                    ILinkPresentation link = (ILinkPresentation) presentation;
                    String source = ((INamedElement) link.getSource().getModel()).getName();
                    String target = ((INamedElement) link.getTarget().getModel()).getName();
                    System.out.println("LINK: " + dependency.getName()
                        + " client=" + dependency.getClient().getName()
                        + " supplier=" + dependency.getSupplier().getName()
                        + " source=" + source + " target=" + target);
                }
                if (presentation.getModel() instanceof INamedElement) {
                    String name = ((INamedElement) presentation.getModel()).getName();
                    if (name.matches("RegisterScreen|MedicalRecordScreen|User|Customer")) {
                        System.out.println("NODE: " + name + " type=" + presentation.getType());
                        for (Object entryObject : presentation.getProperties().entrySet()) {
                            Map.Entry<?, ?> entry = (Map.Entry<?, ?>) entryObject;
                            System.out.println("  " + entry.getKey() + "=" + entry.getValue());
                        }
                    }
                }
            }
        }
        accessor.close();
    }
}
